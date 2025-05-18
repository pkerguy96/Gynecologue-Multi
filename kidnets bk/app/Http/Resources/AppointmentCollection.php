<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class AppointmentCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->collection->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'patient_name' => $appointment->patient ? $appointment->patient->nom . " " . $appointment->patient->prenom : ($appointment->phone_number ? "📞 " . $appointment->phone_number : "Inconnu"),
                'title' => $appointment->title,
                'phone_number' => $appointment->phone_number,
                'date' => $appointment->date,
                'note' => $appointment->note,
            ];
        })->toArray();
    }
}
