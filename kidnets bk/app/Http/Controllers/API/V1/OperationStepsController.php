<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreXrayRequest;
use App\Models\Bloodtest;
use App\Models\Notification;
use App\Models\Operation;
use App\Models\OperationNote;
use App\Models\Ordonance;
use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Product;
use App\Models\ProductOperationConsumables;
use App\Models\User;
use App\Models\WaitingRoom;
use App\Models\Xray;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class OperationStepsController extends Controller
{
    use HttpResponses;
    use UserRoleCheck;
    /* First step we create op */
    public function storeOpNote(Request $request, $id)
    {
        $doctorId = $this->checkUserRole();
        $validated = $request->validate([
            'note' => 'nullable|string',
            'operation' => 'nullable'
        ]);

        try {
            // Find the patient or throw an exception
            $patient = Patient::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();

            // Create the operation

            $operation = isset($request->operation) ? Operation::where('doctor_id', $doctorId)->where('id', $request->operation)->first() : Operation::create([
                'doctor_id' => $doctorId,
                'patient_id' => $patient->id,
            ]);

            // If note exists, process it
            if (!empty($validated['note'])) {
                OperationNote::create([
                    'doctor_id' => $doctorId,
                    'operation_id' => $operation->id,
                    'note' => $validated['note'],
                    'patient_id' => $patient->id,
                ]);
            }

            // Update or create a WaitingRoom entry
            $waiting = WaitingRoom::where('doctor_id', $doctorId)->where('patient_id', $patient->id)->first();
            if ($waiting) {
                $waiting->update(['status' => 'current']);
            } else {
                WaitingRoom::create([
                    'doctor_id' => $doctorId,
                    'status' => 'current',
                    'patient_id' => $patient->id,
                    'entry_time' => now(),
                ]);
            }

            // Return operation ID in response
            return $this->success($operation->id, null, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while creating the operation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* Step 2 Paraclinique insert */
    public function StoreParaclinique(StoreXrayRequest $request)
    {
        try {
            $doctorId = $this->checkUserRole();
            // Validate request data
            $validatedData = $request->validated();

            $xrayItems = $validatedData['xrays']; // Expecting 'xrays' as an array
            $totalPrice = 0;

            $operation = Operation::where('doctor_id', $doctorId)->where('id', $validatedData['operation_id'])->firstOrFail();
            foreach ($xrayItems as $xray) {
                $totalPrice += $xray['price'];
                $xrayData = [
                    'doctor_id' => $doctorId,
                    'patient_id' => $validatedData['patient_id'],
                    'operation_id' => $operation->id,
                    'xray_type' => $xray['type'],
                    'xray_name' => $xray['name'],
                    'price' => $xray['price'],
                    'note' => $xray['note'],

                ];
                Xray::create($xrayData);
            }
            $operation->update(['total_cost' => $totalPrice]);
            $waiting =   WaitingRoom::where('doctor_id', $doctorId)->where('patient_id', $request->patient_id)->first();
            if ($waiting) {
                $waiting->update([
                    'status' => 'current'
                ]);
            } else {
                WaitingRoom::create([
                    'doctor_id' => $doctorId,
                    'status' => 'current',
                    'patient_id'
                    => $request->patient_id,
                    'entry_time' => Carbon::now()
                ]);
            }
            return $this->success($operation->id, 'Radiographies enregistrées avec succès', 201);
        } catch (\Throwable $th) {
            Log::error('Error storing x-ray data: ' . $th->getMessage());

            return $this->error($th->getMessage(), 'Une erreur s\'est produite lors de l\'enregistrement des radiographies', 500);
        }
    }
    public function updateParaclinique(StoreXrayRequest $request)
    {
        try {
            $doctorId = $this->checkUserRole();
            // Validate request data
            $validatedData = $request->validated();
            $xrayItems = $validatedData['xrays']; // Expecting 'xrays' as an array
            $totalPrice = 0;
            // Find the operation or fail
            $operation = Operation::where('doctor_id', $doctorId)->where('id', $validatedData['operation_id'])->firstOrFail();
            // Delete all X-rays related to the operation ID
            Xray::where('doctor_id', $doctorId)->where('operation_id', $operation->id)->delete();
            // Insert the new X-rays
            foreach ($xrayItems as $xray) {
                $totalPrice += $xray['price'];
                $xrayData = [
                    'doctor_id' => $doctorId,
                    'patient_id' => $validatedData['patient_id'],
                    'operation_id' => $operation->id,
                    'xray_type' => $xray['type'],
                    'xray_name' => $xray['name'],
                    'price' => $xray['price'],
                    'note' => $xray['note'],
                ];

                Xray::create($xrayData);
            }

            // Update the operation's total cost
            $operation->update(['total_cost' => $totalPrice]);

            // Update or create a waiting room entry
            $waiting = WaitingRoom::where('doctor_id', $doctorId)->where('patient_id', $request->patient_id)->first();
            if ($waiting) {
                $waiting->update([
                    'status' => 'current',
                ]);
            } else {
                WaitingRoom::create([
                    'doctor_id' => $doctorId,
                    'status' => 'current',
                    'patient_id' => $request->patient_id,
                    'entry_time' => Carbon::now(),
                ]);
            }

            return $this->success($operation->id, 'Radiographies mises à jour avec succès', 200);
        } catch (\Throwable $th) {
            Log::error('Error updating x-ray data: ' . $th->getMessage());

            return $this->error($th->getMessage(), 'Une erreur s\'est produite lors de la mise à jour des radiographies', 500);
        }
    }
    public function EditOpNote(Request $request, $id)
    {
        $validated = $request->validate([
            'note' => 'nullable|string',
            'operation_id' => 'required|integer|exists:operations,id',
        ]);
        Log::info($validated);
        try {
            $doctorId = $this->checkUserRole();
            // Find the patient or throw an exception
            $patient = Patient::where('doctor_id', $doctorId)->where('id', $id)->first();

            // If note exists, process it
            if (!empty($validated['note'])) {
                $dataNote =  OperationNote::where('doctor_id', $doctorId)->where('operation_id', $validated['operation_id'])->first();
                $data  = [
                    'doctor_id' => $doctorId,
                    'operation_id' => $validated['operation_id'],
                    'note' => $validated['note'],
                    'patient_id' => $patient->id
                ];
                if ($dataNote) {
                    $dataNote->update($data);
                } else {
                    OperationNote::create($data);
                }
            }

            // Update or create a WaitingRoom entry
            $waiting = WaitingRoom::where('doctor_id', $doctorId)->where('patient_id', $patient->id)->first();
            if ($waiting) {
                $waiting->update(['status' => 'current']);
            } else {
                WaitingRoom::create([
                    'doctor_id' => $doctorId,
                    'status' => 'current',
                    'patient_id' => $patient->id,
                    'entry_time' => now(),
                ]);
            }

            // Return operation ID in response
            return $this->success($validated['operation_id'], null, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while processing the operation note: ' . $e->getMessage(),
            ], 500);
        }
    }


    /* fetches */
    public function fetchNote($operation_id)
    {
        $doctorId = $this->checkUserRole();
        $data = OperationNote::where('doctor_id', $doctorId)->where('operation_id', $operation_id)->first() ?? [];
        return $this->success($data, null, 200);
    }
    public function fetchXrays($operation_id)
    {
        try {
            $doctorId = $this->checkUserRole();
            $data = Xray::where('doctor_id', $doctorId)->where('operation_id', $operation_id)
                ->select('id', 'xray_name', 'xray_type', 'price')
                ->get();
            if ($data->isEmpty()) {
                return $this->success([], 'No X-rays found', 200);
            }
            return $this->success($data, null, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch X-rays: ' . $e->getMessage()], 500);
        }
    }
    public function fetchOperationBloodTests($operationId)
    {
        try {
            $doctorId = $this->checkUserRole();
            // Fetch blood tests based on operation_id
            $rawBloodTests = BloodTest::where('doctor_id', $doctorId)->where('operation_id', $operationId)->get();

            $formattedBloodTests = [];

            foreach ($rawBloodTests as $bloodTest) {
                // Use the model's accessor to get formatted data
                $formattedBloodTests = array_merge($formattedBloodTests, $bloodTest->formatted_blood_tests);
            }

            // Return formatted results or an empty array if none found
            if (empty($formattedBloodTests)) {
                return $this->success([], 'No blood tests found', 200);
            }

            return $this->success($formattedBloodTests, 'Blood tests retrieved successfully', 200);
        } catch (\Throwable $th) {
            Log::error('Error fetching blood tests: ' . $th->getMessage());

            return $this->error($th->getMessage(), 'An error occurred while retrieving blood tests', 500);
        }
    }
    public function getOrdonanceId($operationId)
    {
        $doctorId = $this->checkUserRole();
        $data = Ordonance::where('doctor_id', $doctorId)->with('OrdonanceDetails')->where('operation_id', $operationId)->select('id', 'date')->first();
        return $this->success($data, null, 200);
    }


    public function deleteRadio($operationid)
    {
        $doctorId = $this->checkUserRole();
        xray::where('doctor_id', $doctorId)->where('operation_id', $operationid)->delete();
        $this->success(null, 'success', 200);
    }

    public function deleteBloodTest($operationid)
    {
        $doctorId = $this->checkUserRole();
        Bloodtest::where('doctor_id', $doctorId)->where('operation_id', $operationid)->delete();
        $this->success(null, 'success', 200);
    }

    public function deleteOrdonance($operationid)
    {
        $doctorId = $this->checkUserRole();
        Ordonance::where('doctor_id', $doctorId)->where('operation_id', $operationid)->delete();
        $this->success(null, 'success', 200);
    }
}
