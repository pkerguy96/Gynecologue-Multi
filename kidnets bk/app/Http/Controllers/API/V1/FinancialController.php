<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SearchOperationDebtResource;
use App\Models\Operation;
use App\Models\Payment;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FinancialController extends Controller
{
    use UserRoleCheck;
    public function PatientsDebt(Request $request)
    {
        $doctorId = $this->checkUserRole();
        $searchQuery = $request->input('searchQuery', '');
        $perPage = $request->get('per_page', 20);
        $query = Operation::where('doctor_id', $doctorId)->with('patient', 'operationdetails', 'payments', 'xray')
            ->where('is_paid', 0)
            ->whereBetween('created_at', [
                Carbon::parse($request->date)->startOfDay(),
                Carbon::parse($request->date2)->endOfDay()
            ]);
        if (!empty($searchQuery)) {
            $query->whereHas('patient', function ($q) use ($searchQuery, $doctorId) {
                $q->where('doctor_id', $doctorId)
                    ->where('nom', 'like', "%{$searchQuery}%")
                    ->orWhere('prenom', 'like', "%{$searchQuery}%");
            });
        }
        $Operations = $query->orderBy('id', 'desc')->paginate($perPage);
        return SearchOperationDebtResource::collection($Operations);
    }

    public function fetchPayments(Request $request)
    {
        $doctorId = $this->checkUserRole();

        try {
            $startDate = Carbon::parse($request->date)->startOfDay();
            $endDate = Carbon::parse($request->date2)->endOfDay();
            $hospitals = $request->hospitals;

            // Query payments with necessary relationships
            $query = Payment::query()
                ->with([
                    'operation.patient', // Include patient info
                    'operation.operationdetails', // Include operation details
                    'operation.xray', // Include xrays
                    'operation.externalOperations', // Include outsource operations
                ])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereHas('operation', function ($q) use ($doctorId) {
                    $q->where('doctor_id', $doctorId); // Scope by doctor_id through Operation
                });

            if ($hospitals && $hospitals !== 'tout') {
                $query->whereHas('operation.externalOperations', function ($q) use ($hospitals) {
                    $q->whereIn('hospital_id', $hospitals);
                });
            }

            $payments = $query->get();

            // Group payments by operation and calculate aggregated results
            $results = $payments->groupBy('operation_id')->map(function ($groupedPayments) {
                $operation = $groupedPayments->first()->operation;

                // Sum all payments for this operation
                $totalAmountPaid = $groupedPayments->sum('amount_paid');

                // Determine if this is an external operation
                $isExternalOperation = $operation->externalOperations && $operation->externalOperations->isNotEmpty();

                // Use fee for external operations or total_cost for others
                $baseAmount = $isExternalOperation
                    ? $operation->externalOperations->sum('fee') // Use fee for external operations
                    : $operation->total_cost; // Use total_cost for regular operations

                // Calculate the remaining amount due
                $amountDue = $baseAmount - $totalAmountPaid;

                // Determine the operation type dynamically
                $operationTypes = collect();

                if ($operation->xray && $operation->xray->isNotEmpty()) {
                    $operationTypes = $operationTypes->merge($operation->xray->pluck('xray_type'));
                }

                if ($operation->operationdetails && $operation->operationdetails->isNotEmpty()) {
                    $operationTypes = $operationTypes->merge($operation->operationdetails->pluck('operation_name'));
                }

                if ($operation->externalOperations && $operation->externalOperations->isNotEmpty()) {
                    $operationTypes = $operationTypes->merge($operation->externalOperations->pluck('operation_type'));
                }

                $operationTypeString = $operationTypes->unique()->implode(', ');

                return [
                    'name' => $operation->patient->nom . ' ' . $operation->patient->prenom,
                    'date' => $operation->created_at->toDateString(),
                    'total_cost' => (float) $baseAmount, // Use baseAmount as total cost
                    'operation_type' => $operationTypeString,
                    'total_amount_paid' => (float) $totalAmountPaid, // Total of all payments for this operation
                    'amount_due' => (float) $amountDue, // Remaining amount due
                ];
            });

            return response()->json(['data' => $results->values()], 200); // Use values() to reset array keys
        } catch (\Throwable $th) {
            Log::error('Error fetching payments', ['error' => $th->getMessage()]);
            return response()->json(['error' => 'An error occurred while fetching payments.'], 500);
        }
    }
}
