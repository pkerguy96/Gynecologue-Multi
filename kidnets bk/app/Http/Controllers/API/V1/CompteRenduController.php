<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompteRenduResource;
use App\Models\CompteRendu;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;
use App\Models\Patient;
use Illuminate\Support\Facades\Log;

class CompteRenduController extends Controller
{
    use UserRoleCheck;
    use HttpResponses;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();
            $perPage = $request->get('per_page', 20);
            $searchQuery = $request->input('searchQuery');


            $operationNotesQuery = CompteRendu::with([
                'patient' => function ($query) {
                    $query->withTrashed()->select('id', 'nom', 'prenom');
                }
            ])->where('doctor_id', $doctorId)
                ->orderBy('id', 'desc');


            if (!empty($searchQuery)) {
                $operationNotesQuery->whereHas('patient', function ($query) use ($searchQuery) {
                    $query->where('nom', 'like', "%{$searchQuery}%")
                        ->orWhere('prenom', 'like', "%{$searchQuery}%");
                });
            }

            // Paginate results
            $operationNotes = $operationNotesQuery->paginate($perPage);

            // Return paginated response using a collection
            return  CompteRenduResource::collection($operationNotes);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {


        try {
            // Check user role to ensure the doctor is authenticated
            $doctorId = $this->checkUserRole();

            // Access `patient_id` and `note` from nested `data`
            $patient_id = $request->input('data.patient_id');
            $note = $request->input('data.note');

            // Validate input
            if (!$patient_id || !$note) {
                return $this->error(null, 'patient_id and note are required.', 400);
            }

            // Create Operation Note
            CompteRendu::create([
                'doctor_id' => $doctorId,
                'patient_id' => $patient_id,
                'note' => $note,
            ]);

            // Fetch Patient Data
            $patient = Patient::where('doctor_id', $doctorId)
                ->where('id', $patient_id)
                ->select('id', 'nom', 'prenom')
                ->first();

            // Return success response
            return $this->success($patient, 'Compte rendu ajouté avec succès.', 201);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $doctorId = $this->checkUserRole();
            $operationNote = CompteRendu::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();
            return $this->success(new CompteRenduResource($operationNote), 'Compte rendu trouvé.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Compte rendu introuvable.', 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $doctorId = $this->checkUserRole();

            // Validate request input
            $validated = $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'note' => 'required|string',
            ]);
            Log::info($request->all());
            // Find the existing Operation Note
            $operationNote = CompteRendu::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();

            // Update the record
            $operationNote->update([
                'patient_id' => $validated['patient_id'],
                'note' => $validated['note'],
            ]);
            $patient = Patient::where('doctor_id', $doctorId)
                ->where('id', $validated['patient_id'])
                ->select('id', 'nom', 'prenom')
                ->first();
            // Return success response with updated data
            return $this->success($patient, 'Compte rendu mis à jour avec succès.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $doctorId = $this->checkUserRole(); // Ensure the user has the correct role

            // Find the Operation Note only if it belongs to the logged-in doctor
            $operationNote = CompteRendu::where('doctor_id', $doctorId)
                ->where('id', $id)
                ->firstOrFail();

            // Delete the operation note
            $operationNote->delete();

            // Return success response
            return $this->success(null, 'Compte rendu supprimé avec succès.', 200);
        } catch (\Throwable $th) {
            return $this->error(null, 'Erreur lors de la suppression du compte rendu.', 500);
        }
    }
}
