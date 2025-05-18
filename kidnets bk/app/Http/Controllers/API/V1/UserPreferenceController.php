<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\OperationPreferenceRequest;
use App\Traits\HttpResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserPreference;

class UserPreferenceController extends Controller
{
    use HttpResponses;
    public function DashboardKpiUserPref(Request $request)
    {
        if (!$request->input('period')) {
            return $this->error(null, 'Veuillez sélectionner une période', 501);
        }
        $user = Auth::user();
        $doctorId = ($user->role === 'nurse') ? $user->doctor_id : $user->id;
        if (!$user) {
            return $this->error(null, 'Aucun utilisateur trouvé', 501);
        }
        UserPreference::where('doctor_id', $doctorId)->update([
            'kpi_date' => $request->input('period'),
        ]);
        return $this->success('success', 'La préférence a été modifiée', 200);
    }
    public function getUserLocation()
    {
        $user = Auth::user();
        if (!$user) {
            return $this->error(null, 'Aucun utilisateur trouvé', 404);
        }

        $doctorId = ($user->role === 'nurse') ? $user->doctor_id : $user->id;
        $data = UserPreference::where('doctor_id', $doctorId)
            ->select('location', 'header')
            ->first();
        return response()->json([
            'data' => $data,
        ], 200);
    }
    public function LocationPref(Request $request)
    {
        $request->validate([
            'location' => 'required|string|max:255',
            'header' => 'required|boolean',
        ]);

        $user = Auth::user();
        if (!$user) {
            return $this->error(null, 'Aucun utilisateur trouvé', 404);
        }

        $doctorId = ($user->role === 'nurse') ? $user->doctor_id : $user->id;

        UserPreference::updateOrCreate(
            ['doctor_id' => $doctorId],
            ['location' => $request->input('location'), 'header' => $request->input('header')]
        );

        return $this->success('success', 'La préférence a été modifiée', 200);
    }
}
