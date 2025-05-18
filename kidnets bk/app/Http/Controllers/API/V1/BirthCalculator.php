<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BirthCalculationResource;
use App\Http\Resources\tinyBirthCalculationResource;
use App\Models\BirthCalculator as ModelsBirthCalculator;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Spatie\Permission\Traits\HasRoles;

class BirthCalculator extends Controller
{
    /**
     * Display a listing of the resource.
     */
    use UserRoleCheck;

    public function index(Request $request)
    {

        $doctorId = $this->checkUserRole();
        $searchQuery = $request->input('searchQuery');
        $startDate = $request->input('start') ? Carbon::parse($request->input('start'))->startOfDay() : null;
        $endDate = $request->input('end') ? Carbon::parse($request->input('end'))->endOfDay() : null;

        $query = ModelsBirthCalculator::with('patient')
            ->where('doctor_id', $doctorId);

        // Date filtering
        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('date', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        // Search by patient name or type
        if (!empty($searchQuery)) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('type', 'like', "%{$searchQuery}%")
                    ->orWhereHas('patient', function ($subQuery) use ($searchQuery) {
                        $subQuery->where('nom', 'like', "%{$searchQuery}%")
                            ->orWhere('prenom', 'like', "%{$searchQuery}%");
                    });
            });
        }

        $calculations = $query->orderByDesc('id')->paginate($request->get('per_page', 20));

        return BirthCalculationResource::collection($calculations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:255',
            'date' => 'nullable|date',
            'weeks' => 'nullable|integer|min:0',
            'days' => 'nullable|integer|min:0|max:6',
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:users,id',
        ]);

        $validated['doctor_id'] = $validated['doctor_id'] ?? auth()->user()->doctor_id ?? auth()->id();
        $existing = ModelsBirthCalculator::where('patient_id', $validated['patient_id'])->first();
        if ($existing) {
            return response()->json([
                'message' => 'Un calcul de grossesse existe déjà pour ce patient.',
                'data' => $existing,
            ], 422);
        }
        $birthCalc = ModelsBirthCalculator::create($validated);

        return response()->json([
            'message' => 'Birth record created successfully.',
            'data' => $birthCalc,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $birthCalc = ModelsBirthCalculator::with('patient')->findOrFail($id);

        return response()->json([
            'data' => new tinyBirthCalculationResource($birthCalc),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {


        $birthCalc = ModelsBirthCalculator::findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|string|max:255',
            'date' => 'nullable|date',
            'weeks' => 'nullable|integer|min:0',
            'days' => 'nullable|integer|min:0|max:6',
            'patient_id' => 'required|exists:patients,id',
        ]);

        $birthCalc->update($validated);

        return response()->json([
            'message' => 'Birth record updated successfully.',
            'data' => $birthCalc,
        ]);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $birthCalc = ModelsBirthCalculator::findOrFail($id);
        $birthCalc->delete();

        return response()->json([
            'message' => 'Birth record deleted successfully.',
        ]);
    }
}
