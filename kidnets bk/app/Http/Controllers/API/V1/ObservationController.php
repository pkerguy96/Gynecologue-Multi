<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ObservationResource;
use App\Models\observation;
use App\Models\Patient;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ObservationController extends Controller
{
    use UserRoleCheck;
    use HttpResponses;


    public function GetObservationNote($observationId)
    {
        try {
            $doctorId = $this->checkUserRole();
            $observation = observation::where('doctor_id', $doctorId)
                ->where('patient_id', $observationId)
                ->first();
            if (!$observation) {

                return response()->json([
                    'success' => true,
                    'data' => null,
                ], 200);
            }
            return $this->success([
                'id' => $observation->id,
                'patient_id' => $observation->patient_id,
                'note' => $observation->note,
                'date' => Carbon::parse($observation->created_at)->format('d/m/Y'),
            ], 'success', 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while retrieving the observation: ' . $e->getMessage(),
            ], 500);
        }
    }

    /*    public function StoreObservationNote(Request $request)
    {
        try {

            $doctorId = $this->checkUserRole();

            $patientId = $request->input('data.patientid');
            $note = $request->input('data.note');
            $patient = Patient::where('doctor_id', $doctorId)->where('id', $patientId)->firstOrFail();



            $operation = isset($request->operation) ? Operation::findorfail($request->operation) : Operation::create([
                'doctor_id' => $doctorId,
                'patient_id' => $patient->id,
            ]);

            if (!empty($note) && !empty(trim($note))) {
                Observation::create([
                    'doctor_id' => $doctorId,
                    'operation_id' => $operation->id,
                    'patient_id' => $patient->id,
                    'note' => $note
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
    } */



    /* 
    public function EditObservationNote(Request $request, $observationId)
    {

        try {
            $doctorId = $this->checkUserRole();

            // Retrieve observation
            $observation = Observation::where('doctor_id', $doctorId)
                ->where('patient_id', $observationId)
                ->first();

            if (!$observation) {

                return response()->json([
                    'error' => 'Observation not found or access denied.',
                ], 404);
            }


            // Retrieve patient
            $patient = Patient::where('doctor_id', $doctorId)
                ->where('id', $observation->patient_id)
                ->first();

            if (!$patient) {

                return response()->json([
                    'error' => 'Patient not found.',
                ], 404);
            }


            // Ensure operation exists
            $operation = Operation::find($observation->operation_id);

            if (!$operation) {
                Log::warning("Operation not found. Operation ID: {$observation->operation_id}");
                return response()->json([
                    'error' => 'Operation not found.',
                ], 404);
            }
            Log::info("Operation found. Operation ID: {$operation->id}");

            // Update the observation note if provided
            $note = $request->input('note'); // Corrected note retrieval

            if (!empty($note) && !empty(trim(strip_tags($note)))) { // Remove HTML tags before checking emptiness
                Log::info("Updating Observation Note: $note");

                $observation->update([
                    'note' => $note,
                ]);

                Log::info("Observation updated successfully. Observation ID: $observationId");
            } else {
                Log::warning("Note is empty or not provided.");
                return response()->json(['error' => 'Observation note cannot be empty.'], 400);
            }

            // Update or create a WaitingRoom entry
            $waiting = WaitingRoom::where('doctor_id', $doctorId)
                ->where('patient_id', $patient->id)
                ->first();

            if ($waiting) {
                Log::info("Updating WaitingRoom entry for Patient ID: {$patient->id}");
                $waiting->update(['status' => 'current']);
            } else {
                Log::info("Creating new WaitingRoom entry for Patient ID: {$patient->id}");
                WaitingRoom::create([
                    'doctor_id' => $doctorId,
                    'status' => 'current',
                    'patient_id' => $patient->id,
                    'entry_time' => now(),
                ]);
            }

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Observation updated successfully',
                'observation_id' => $observation->id
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error Updating Observation: " . $e->getMessage());

            return response()->json([
                'error' => 'An error occurred while updating the observation: ' . $e->getMessage(),
            ], 500);
        }
    } */


    public function index(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();
            $perPage = $request->get('per_page', 20);
            $searchQuery = $request->input('searchQuery');


            $observationsQuery = Observation::with([
                'patient' => function ($query) {
                    $query->withTrashed()->select('id', 'nom', 'prenom');
                }
            ])->where('doctor_id', $doctorId)
                ->orderBy('id', 'desc');


            if (!empty($searchQuery)) {
                $observationsQuery->whereHas('patient', function ($query) use ($searchQuery) {
                    $query->where('nom', 'like', "%{$searchQuery}%")
                        ->orWhere('prenom', 'like', "%{$searchQuery}%");
                });
            }

            // Paginate results
            $observations = $observationsQuery->paginate($perPage);

            // Return paginated response using a resource
            return ObservationResource::collection($observations);
        } catch (\Throwable $th) {
            return $this->error(null, 'Erreur lors de la récupération des observations.', 500);
        }
    }
    public function store(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();

            // Extract patient_id and note manually from the nested request
            $patient_id = $request->input('data.patient_id');
            $note = $request->input('data.note');

            // Validate extracted data
            if (!$patient_id || !$note) {
                return $this->error(null, 'Le champ patient_id et note sont obligatoires.', 400);
            }

            // Check if the patient already has an observation
            $existingObservation = Observation::where('doctor_id', $doctorId)
                ->where('patient_id', $patient_id)
                ->exists();

            if ($existingObservation) {
                return $this->error(null, "Une seule observation clinique est autorisée par patient.", 400);
            }

            // Create Observation
            Observation::create([
                'doctor_id' => $doctorId,
                'patient_id' => $patient_id,
                'note' => $note,
            ]);

            // Fetch Patient Data
            $patient = Patient::where('doctor_id', $doctorId)
                ->where('id', $patient_id)
                ->select('id', 'nom', 'prenom')
                ->first();

            return $this->success($patient, 'Observation clinique ajoutée avec succès.', 201);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            $doctorId = $this->checkUserRole(); // Ensure the doctor is authorized

            // Validate request input
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'note' => 'required|string',
            ]);

            // Find the Observation Clinique for the doctor
            $observation = Observation::where('doctor_id', $doctorId)
                ->where('id', $id)
                ->firstOrFail();

            // Update the observation
            $observation->update([
                'patient_id' => $validated['patient_id'],
                'note' => $validated['note'],
            ]);

            return $this->success(new ObservationResource($observation), 'Observation clinique mise à jour avec succès.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Erreur lors de la mise à jour de l\'observation clinique.', 500);
        }
    }
    public function show(string $id)
    {
        try {
            $doctorId = $this->checkUserRole(); // Ensure the user is authorized

            // Find the observation and include patient details (even if deleted)
            $observation = Observation::with([
                'patient' => function ($query) {
                    $query->withTrashed()->select('id', 'nom', 'prenom');
                }
            ])->where('doctor_id', $doctorId)
                ->where('id', $id)
                ->firstOrFail(); // Returns 404 if not found

            return $this->success(new ObservationResource($observation), 'Observation clinique trouvée.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Observation clinique introuvable.', 404);
        }
    }
    public function updateObservation(Request $request, string $id)
    {

        try {
            $doctorId = $this->checkUserRole(); // Ensure the doctor is authorized

            // Validate request input
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'note' => 'required|string',
            ]);

            // Find the Observation Clinique for the doctor
            $observation = Observation::where('doctor_id', $doctorId)
                ->where('id', $id)
                ->firstOrFail();

            // Update the observation
            $observation->update([
                'patient_id' => $validated['patient_id'],
                'note' => $validated['note'],
            ]);
            $patient = Patient::where('doctor_id', $doctorId)
                ->where('id', $validated['patient_id'])
                ->select('id', 'nom', 'prenom')
                ->first();
            return $this->success($patient, 'Observation clinique mise à jour avec succès.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Erreur lors de la mise à jour de l\'observation clinique.', 500);
        }
    }
    public function destroy(string $id)
    {
        try {
            $doctorId = $this->checkUserRole();


            $observation = Observation::where('doctor_id', $doctorId)
                ->where('id', $id)
                ->firstOrFail();


            $observation->delete();

            return $this->success(null, 'Observation clinique supprimée avec succès.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Erreur lors de la suppression de l\'observation clinique.', 500);
        }
    }
}
