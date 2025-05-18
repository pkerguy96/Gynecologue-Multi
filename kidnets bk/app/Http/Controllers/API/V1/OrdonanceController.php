<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Ordonance;
use Illuminate\Http\Request;
use App\Http\Resources\OrdonanceCollection;
use App\Http\Resources\OrdonanceResource;
use App\Models\Ordonance_Details;
use App\Models\WaitingRoom;
use App\Traits\HasPermissionCheck;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdonanceController extends Controller
{
    use HttpResponses;
    use HasPermissionCheck;
    use UserRoleCheck;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_ordonance', 'insert_ordonance', 'update_ordonance', 'delete_ordonance']);
        $searchQuery = $request->input('searchQuery');
        $perPage = $request->get('per_page', 20);

        $ordonancesQuery = Ordonance::where('doctor_id', $doctorId)->select('id', 'patient_id', 'date')
            ->with([
                'Patient' => function ($query) {
                    $query->withTrashed()->select('id', 'nom', 'prenom');
                },
            ])
            ->orderBy('id', 'desc');
        if (!empty($searchQuery)) {
            $ordonancesQuery->whereHas('Patient', function ($query) use ($searchQuery, $doctorId) {
                $query->where('doctor_id', $doctorId)
                    ->where('nom', 'like', "%{$searchQuery}%")
                    ->orWhere('prenom', 'like', "%{$searchQuery}%");
            });
        }
        $ordonances = $ordonancesQuery->paginate($perPage);
        return new OrdonanceCollection($ordonances);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'insert_ordonance', 'access_ordonance']);
        try {
            $medicineArray = $request->medicine;
            DB::beginTransaction();
            // Create the Ordonance record
            $ordonance = Ordonance::create([
                'doctor_id' => $doctorId,
                'operation_id' => $request->input('operation_id'),
                'patient_id' => $request->input('patient_id'),
                'date' => $request->input('date'),
            ]);
            foreach ($medicineArray as $medicine) {
                Ordonance_Details::create([
                    'ordonance_id' => $ordonance->id,
                    'medicine_name' => $medicine['medicine_name'],
                    'note' => $medicine['note'],
                ]);
            }
            DB::commit();
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
            $data = new OrdonanceResource(Ordonance::where('doctor_id', $doctorId)->with('OrdonanceDetails')->where('id', $ordonance->id)->first());
            // Return a response with the created Ordonance and OrdonanceDetails
            return response()->json([
                'message' => 'Ordonance created successfully',
                'data' => $data,
            ], 201);
        } catch (\Exception $e) {
            // Rollback the transaction in case of an error
            DB::rollBack();
            Log::error($e);
            // Return an error response
            return response()->json([
                'message' => 'Error creating Ordonance',
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {

        $doctorId = $this->checkUserRole(['superadmin', 'insert_ordonance', 'update_ordonance', 'delete_ordonance', 'access_ordonance']);
        $data = Ordonance::where('doctor_id', $doctorId)->with('OrdonanceDetails', 'Patient')->where('id', $id)->first();
        return response()->json(['data' => $data], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $doctorId =  $this->checkUserRole(['superadmin', 'update_ordonance', 'access_ordonance']);
        try {

            $ordonance = Ordonance::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();;
            // Start a database transaction
            DB::beginTransaction();

            // Update the Ordonance record with the new data
            $ordonance->update([
                'patient_id' => $request->input('patient_id'),
                'date' => $request->input('date'),
                // Add any other fields you want to update
            ]);

            // Validate and update OrdonanceDetails records
            $medicineArray = $request->medicine;

            // Delete existing OrdonanceDetails records
            $ordonance->OrdonanceDetails()->delete();

            // Create new OrdonanceDetails records
            foreach ($medicineArray as $medicine) {
                $ordonance->OrdonanceDetails()->create([
                    'ordonance_id' => $ordonance->id,
                    'medicine_name' => $medicine['medicine_name'],
                    'note' => $medicine['note'],
                ]);
            }
            DB::commit();
            $data = new OrdonanceResource(Ordonance::where('doctor_id', $doctorId)->with('OrdonanceDetails')->where('id', $ordonance->id)->firstOrFail());
            return response()->json([
                'message' => 'Ordonance updated successfully',
                'data' => $data,
            ], 200);
        } catch (\Exception $e) {
            // Rollback the transaction in case of an error
            DB::rollBack();
            Log::info($e);
            // Return an error response
            return response()->json(['message' => 'Error updating Ordonance'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'delete_ordonance', 'access_ordonance']);
        try {

            $ordonance = Ordonance::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();
            if ($ordonance) {
                $ordonance->OrdonanceDetails()->delete();
                $ordonance->delete();
                return $this->success(null, 'Ordonance deleted successfuly', 200);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting ordonance', ['exception' => $e]);
            return $this->success(null, 'oops there is an error:' . $e->getMessage(), 500);
        }
    }
}
