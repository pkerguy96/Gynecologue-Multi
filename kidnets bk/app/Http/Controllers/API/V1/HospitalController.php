<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\hospital;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;

class HospitalController extends Controller
{
    use HttpResponses;
    use UserRoleCheck;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $doctorId = $this->checkUserRole();
        try {
            $hospitals = hospital::where('doctor_id', $doctorId)->get();
            return $this->success($hospitals, 'success', 200);
        } catch (\Throwable $th) {
            return $this->error($th->getMessage(), 'error', 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $doctorId = $this->checkUserRole();

        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'nullable|string|max:255',
                'contact_info' => 'nullable|string|max:255',
            ]);
            $validatedData['doctor_id'] = $doctorId;
            // Create a new hospital
            Hospital::create($validatedData);
            return $this->success(null, 'success', 200);
        } catch (\Throwable $th) {
            return $this->error($th->getMessage(), 'error', 500);
        }
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $doctorId = $this->checkUserRole();

        try {
            $hospital = Hospital::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();
            // Check if hospital exists
            if (!$hospital) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hospital not found.'
                ], 404);
            }

            // Delete the hospital
            $hospital->delete();
            return $this->success(null, 'success', 200);
        } catch (\Throwable $th) {
            return $this->error($th->getMessage(), 'error', 200);
        }
    }
}
