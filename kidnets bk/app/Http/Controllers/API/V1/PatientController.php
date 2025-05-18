<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Patient;

use App\Http\Resources\PatientCollection;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Http\Resources\PatientDetailResource;
use App\Models\User;
use App\Traits\HasPermissionCheck;
use App\Traits\UserRoleCheck;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Faker\Factory as Faker;

class PatientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    use UserRoleCheck;
    use HasPermissionCheck;

    public function createPatientWithEmail(Request $request, $email)
    {
        $faker = Faker::create(); // Create a new Faker instance
        if (User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Email is already taken.'], 400);
        }
        // Generate a patient with the provided email and a default password
        $patient = User::create([
            'email' => $email,
            'password' => bcrypt('password'), // Leave password as 'password'
            'doctor_id' => null,
            'nom' => 'John', // You can change this if you want dynamic names
            'prenom' => 'Doe', // Same here for dynamic generation
            'cin' => strtoupper(Str::random(6)), // Example for CIN
            'date' => now()->format('Y-m-d'), // Default current date
            'address' => '123 Main St', // You can change this as needed
            'sex' => 'male', // Default sex, adjust if needed
            'phone_number' => $faker->unique()->numerify('##########'),


            'role' => 'doctor'
        ]);

        // Return a response to confirm creation
        return response()->json(['message' => 'Patient created successfully', 'patient' => $patient], 201);
    }
    public function index(Request $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_patient', 'insert_patient', 'update_patient', 'delete_patient', 'detail_patient']);
        if ($doctorId instanceof JsonResponse) {
            return $doctorId; // Return the permission error response directly
        }


        // Get filter values
        $searchQuery = $request->input('searchQuery');
        $startDate = $request->input('start') ? Carbon::parse($request->input('start'))->startOfDay() : null;
        $endDate = $request->input('end') ? Carbon::parse($request->input('end'))->endOfDay() : null;

        // Base query: Retrieve patients, including the last operation
        $query = Patient::where('doctor_id', $doctorId)
            ->with(['appointments', 'Ordonance', 'operations' => function ($q) {
                $q->latest('created_at')->limit(1); // Get the last operation
            }, 'calculation']);

        // ✅ Fix: Remove patient-level date filtering (keep all patients)
        // Only filter using `operations`

        // ✅ Apply date filtering for operations
        if ($startDate || $endDate) {
            $query->whereHas('operations', function ($q) use ($startDate, $endDate) {
                if ($startDate && $endDate) {
                    $q->whereBetween('created_at', [$startDate, $endDate]);
                } elseif ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                } elseif ($endDate) {
                    $q->where('created_at', '<=', $endDate);
                }
            });
        }

        // ✅ Apply search filtering if a query is provided
        if (!empty($searchQuery)) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('nom', 'like', "%{$searchQuery}%")
                    ->orWhere('prenom', 'like', "%{$searchQuery}%");
            });
        }

        // ✅ Order patients correctly and paginate
        $patients = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 20));

        return new PatientCollection($patients);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePatientRequest $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'insert_patient', 'access_patient']);

        try {
            $requestData = $request->validated();
            $requestData['doctor_id'] = $doctorId;

            // Create patient
            $patient = Patient::create($requestData);

            // Create children if present
            if (!empty($requestData['children'])) {
                foreach ($requestData['children'] as $child) {
                    $patient->children()->create([
                        'doctor_id' => $doctorId,
                        'dob' => $child['dob'] ?? null,
                        'birth_type' => $child['birthType'],
                    ]);
                }
            }

            return response()->json([
                'message' => 'Patient created successfully',
                'data' => new PatientResource($patient->load('children'))
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create patient',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /*     public function patientDetails(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'detail_patient', 'access_patient']);
        return  new PatientDetailResource(Patient::where('doctor_id', $doctorId)->with('appointments', 'operations', 'operations.operationdetails', 'Xray', 'Ordonance', 'operationsNote')->where('id', $id)->first());
    } */
    public function patientDetails(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'detail_patient', 'access_patient']);

        return new PatientDetailResource(
            Patient::where('doctor_id', $doctorId)
                ->with([
                    'appointments',
                    'operations' => function ($query) {
                        $query->withTrashed()->with('operationdetails');
                    },
                    'Xray' => function ($query) {
                        $query->withTrashed();
                    },
                    'Ordonance',
                    'operationsNote',

                ])
                ->where('id', $id)
                ->first()
        );
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_patient']);
        return  new PatientResource(Patient::with('children')->where('doctor_id', $doctorId)->where('id', $id)->first());
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePatientRequest $request, $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'update_patient', 'access_patient']);

        $patient = Patient::where('doctor_id', $doctorId)->findOrFail($id);

        $validatedData = $request->validated();
        $patient->update($validatedData);
        if (isset($validatedData['children'])) {
            // Remove old children and insert new ones
            $patient->children()->delete();

            foreach ($validatedData['children'] as $child) {
                // Skip completely empty rows (like { dob: '', birthType: '' })
                if (empty($child['dob']) && empty($child['birthType'])) continue;

                $patient->children()->create([
                    'doctor_id' => $doctorId,
                    'dob' => $child['dob'] ?? null,
                    'birth_type' => $child['birthType'] ?? null,
                ]);
            }
        }
        return response()->json([
            'message' => 'Patient updated successfully.',
            'data' => new \App\Http\Resources\PatientResource($patient->load('children')),
        ]);
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {

        $doctorId = $this->checkUserRole(['superadmin', 'delete_patient', 'access_patient']);
        Patient::where('doctor_id', $doctorId)->findorfail($id)->delete();
        return response()->json(['message' => 'patient deleted successfully'], 204);
    }

    public function patientTinyData(string $id)
    {
        $doctorId = $this->checkUserRole();
        $patient =  Patient::where('doctor_id', $doctorId)->where('id', $id)->select('id', 'nom', 'prenom')->first();
        return response()->json([
            'message' => 'Patient updated successfully.',
            'data' =>
            $patient,
        ], 200);
    }
}
