<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OperationPaymentCollection;
use Illuminate\Http\Request;
use App\Models\Operation;
use App\Http\Resources\OperationResource;
use App\Http\Resources\PayementResource;
use App\Http\Resources\treatementOperationCollection;
use App\Http\Resources\XrayCollectionForNurse;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Xray;
use App\Traits\HasPermissionCheck;
use App\Traits\UserRoleCheck;
use Illuminate\Support\Facades\Log;

class OperationController extends Controller
{
    use HasPermissionCheck;
    use UserRoleCheck;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_debt', 'insert_debt', 'delete_debt']);
        $searchQuery = $request->input('searchQuery');
        $perPage = $request->get('per_page', 20);
        $isPaid = $request->input('isPaid'); // Get the isPaid filter

        $operationsQuery = Operation::where('doctor_id', $doctorId)->where('outsource', '<>', 1)
            ->with([
                'patient' => function ($query) {
                    $query->withTrashed();
                },
                'payments',
                'xray',
            ])
            ->orderBy('id', 'desc');

        if (!empty($searchQuery)) {
            $operationsQuery->whereHas('patient', function ($query) use ($searchQuery) {
                $query->where('nom', 'like', "%{$searchQuery}%")
                    ->orWhere('prenom', 'like', "%{$searchQuery}%");
            });
        }

        if ($isPaid !== null) { // Apply the isPaid filter if provided
            $operationsQuery->where('is_paid', $isPaid);
        }

        $operations = $operationsQuery->paginate($perPage);

        return new OperationPaymentCollection($operations);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {}
    public function getByOperationId($operationId)
    {
        $doctorId = $this->checkUserRole();
        $operation = Operation::where('doctor_id', $doctorId)->with([
            'operationdetails',
            'xray',
            'payments',
            'externalOperations',
            'patient' => function ($query) {
                $query->withTrashed()->select('id', 'nom', 'prenom');
            },
        ])->where('id', $operationId)->first();

        if (!$operation) {
            return response()->json(['error' => 'Operation not found'], 404);
        }
        Log::info($operation->toArray());

        return new OperationResource($operation);
    }




    public function recurringOperation(Request $request)
    {

        $doctorId = $this->checkUserRole(['superadmin', 'access_operation_recurring']);
        $searchQuery = $request->input('searchQuery');
        $perPage = $request->get('per_page', 20); // Default items per page is 20

        $operationsQuery = Operation::where('doctor_id', $doctorId)->where('treatment_nbr', '>', 0)
            ->where('treatment_isdone', 0)
            ->with([
                'operationdetails' => function ($query) {
                    $query->select('operation_id', 'operation_name'); // Include operation_id
                },
                'xray' => function ($query) {
                    $query->select('operation_id', 'xray_type'); // Include operation_id
                },
                'patient' => function ($query) {
                    $query->withTrashed()->select('id', 'nom', 'prenom'); // Include trashed patients
                },
            ])
            ->orderBy('id', 'desc');

        // Apply search filter if a search query is provided
        if (!empty($searchQuery)) {
            $operationsQuery->whereHas('patient', function ($query) use ($searchQuery, $doctorId) {
                $query->where('doctor_id', $doctorId)
                    ->where('nom', 'like', "%{$searchQuery}%")
                    ->orWhere('prenom', 'like', "%{$searchQuery}%");
            });
        }

        $operations = $operationsQuery->paginate($perPage);

        return new treatementOperationCollection($operations);
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */

    public function update(Request $request, string $id)
    {
        try {
            $doctorId = $this->checkUserRole();
            $operation = Operation::where('doctor_id', $doctorId)
                ->with('externalOperations')
                ->where('id', $id)
                ->firstOrFail();
            $amountPaid = (float) $request->amount_paid;
            if ($amountPaid < 0) {
                return response()->json(['error' => 'Le montant payé ne peut pas être un nombre négatif.'], 400);
            }

            $isOutsource = $operation->outsource;
            $baseAmount = $isOutsource
                ? $operation->externalOperations->sum(function ($externalOperation) {
                    return (float) $externalOperation['fee']; // Explicitly cast fee to float
                })
                : (float) $operation->total_cost;
            $sumAmountPaid = (float) Payment::where('operation_id', $id)->sum('amount_paid');
            if (!isset($amountPaid) || empty($amountPaid)) {
                return response()->json(['error' => 'Le montant payé est requis'], 400);
            }

            if ($amountPaid > $baseAmount) {
                return response()->json(['error' => "Le montant payé dépasse le coût total."], 400);
            } elseif ($sumAmountPaid + $amountPaid > $baseAmount) {
                return response()->json(['error' => "Le montant total payé dépasse le coût total."], 400);
            } elseif ($sumAmountPaid + $amountPaid <= $baseAmount) {
                $payment = Payment::create([
                    'operation_id' => $operation->id,
                    'total_cost' => $baseAmount, // Use the calculated base amount
                    'amount_paid' => $amountPaid,
                    'patient_id' => $operation->patient_id
                ]);
                $isFullyPaid = $sumAmountPaid + $amountPaid === $baseAmount;
                $operation->update(['is_paid' => $isFullyPaid ? 1 : 0]);
                return response()->json([
                    'message' => "Paiement ajouté avec succès.",
                    'data' => new PayementResource($payment)
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error during payment update', [
                'error_message' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => $e->getMessage()], 500);
        }
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $doctorId = $this->checkUserRole();
        Operation::where('doctor_id', $doctorId)
            ->where('id', $id)
            ->firstOrFail()->delete();

        return response()->json(['message' => 'Operation deleted successfully'], 204);
    }

    public function deletePaymentDetail($id)
    {
        $doctorId = $this->checkUserRole();

        // Retrieve operation ID for the payment
        $operationId = Payment::where('id', $id)->value('operation_id');
        // Delete the payment by getting the operation first 
        Payment::where('operation_id', $operationId)->findOrFail($id)->delete();
        // Calculate total paid amount and total price
        $sumAmountPaid = (float) Payment::where('operation_id', $operationId)->sum('amount_paid');
        $totalPrice = (float) Operation::where('id', $operationId)->value('total_cost');
        // Update operation status based on payment status
        Operation::where('doctor_id', $doctorId)->where('id', $operationId)->update(['is_paid' => ($sumAmountPaid === $totalPrice) ? 1 : 0]);
        return response()->json(['message' => 'Payment deleted successfully'], 204);
    }

    public function getXraysByOperation($operationId)
    {
        $doctorId = $this->checkUserRole();
        $xrays = Xray::where('doctor_id', $doctorId)->with('patient')
            ->where('operation_id', $operationId)
            ->get();
        return new XrayCollectionForNurse($xrays);
    }
    public function getOperationData($operationId)
    {
        $doctorId = $this->checkUserRole();
        $data = Operation::with([
            'patient:id,nom,prenom,cin',
            'operationdetails',
            'xray',
            'bloodType',
            'ordonance',
            'ordonance.OrdonanceDetails',
            'OperationNote:id,operation_id,note'

        ])->where('doctor_id', $doctorId)->where('id', $operationId)->first();
        return response()->json(['data' => $data], 200);
    }
}
