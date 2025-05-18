<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\BloodTestPreference as ModelsBloodTestPreference;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BloodTestPreference extends Controller
{
    /**
     * Display a listing of the resource.
     */
    use UserRoleCheck;
    public function index()
    {
        $doctorId = $this->checkUserRole();
        $preferences = ModelsBloodTestPreference::where('doctor_id', $doctorId)->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $preferences,
        ], 200);
    }

    public function getAllPreferences(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();
            $searchQuery = $request->input('searchQuery', '');
            $preferences = ModelsBloodTestPreference::where('doctor_id', $doctorId)->when(!empty($searchQuery), function ($query) use ($searchQuery) {
                $query->whereRaw('LOWER(title) LIKE ?', ["%" . strtolower($searchQuery) . "%"])
                    ->orWhereRaw('LOWER(code) LIKE ?', ["%" . strtolower($searchQuery) . "%"]);
            })
                ->get(['title', 'code', 'price', 'delai']) // Specify the columns to retrieve
                ->map(function ($preference) {
                    return [
                        'title' => $preference->title,
                        'code' => $preference->code,
                        'delai' => $preference->delai,
                        'price' => $preference->price,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $preferences,
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $doctorId = $this->checkUserRole();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|unique:blood_test_preferences,title',
            'code' => 'string|unique:blood_test_preferences,code',
            'price' => 'numeric',
            'delai' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }
        $dataLoad = $request->all();
        $dataLoad['doctor_id'] = $doctorId;
        try {
            $preference = ModelsBloodTestPreference::create($dataLoad);

            return response()->json([
                'success' => true,
                'message' => 'Blood test preference created successfully',
                'data' => $preference,
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong',
                'error' => $th->getMessage(),
            ], 500);
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
        $preference = ModelsBloodTestPreference::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();

        if (!$preference) {
            return response()->json([
                'success' => false,
                'message' => 'Blood test preference not found',
            ], 404);
        }

        try {
            $preference->delete();

            return response()->json([
                'success' => true,
                'message' => 'Blood test preference deleted successfully',
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong',
                'error' => $th->getMessage(),
            ], 500);
        }
    }
}
