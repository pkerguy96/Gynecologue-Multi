<?php

namespace App\Observers;

use App\Models\Patient;
use App\Models\WaitingRoom;
use Illuminate\Support\Facades\Auth;

class PatientObserver
{
    /**
     * Handle the Patient "created" event.
     */
    public function created(Patient $patient): void
    {
        $user = Auth::user();
        $doctorId = $user->role === 'nurse' ? $user->doctor_id : $user->id;
        WaitingRoom::create([
            'doctor_id' => $doctorId,
            'patient_id' => $patient->id,
            'status' => 'waiting',
            'entry_time' => now()
        ]);
    }

    /**
     * Handle the Patient "updated" event.
     */
    public function updated(Patient $patient): void
    {
        //
    }

    /**
     * Handle the Patient "deleted" event.
     */
    public function deleted(Patient $patient): void
    {
        WaitingRoom::where('patient_id', $patient->id)->delete();
    }

    /**
     * Handle the Patient "restored" event.
     */
    public function restored(Patient $patient): void
    {
        //
    }

    /**
     * Handle the Patient "force deleted" event.
     */
    public function forceDeleted(Patient $patient): void
    {
        //
    }
}
