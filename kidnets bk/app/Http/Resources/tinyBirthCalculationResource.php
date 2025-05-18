<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class tinyBirthCalculationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'date' => $this->date,
            'weeks' => $this->weeks,
            'days' => $this->days,
            'patient_id' => $this->patient_id,
            'patient' => [
                'id' => $this->patient->id,
                'full_name' => $this->patient->nom . ' ' . $this->patient->prenom,
            ],
        ];
    }
}
