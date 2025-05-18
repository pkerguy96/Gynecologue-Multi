<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ObservationResource extends JsonResource
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
            'patient_id' => $this->patient_id,
            'note' => $this->note,
            'patient_name' => $this->patient->nom . ' ' . $this->patient->prenom,
            'created_at' => Carbon::parse($this->created_at)->format('d/m/Y'),
        ];
    }
}
