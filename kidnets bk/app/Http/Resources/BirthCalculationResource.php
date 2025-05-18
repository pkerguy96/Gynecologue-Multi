<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BirthCalculationResource extends JsonResource
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
            'patient_name' => $this->patient->nom . ' ' . $this->patient->prenom,
            'patient_id' => $this->patient->id,
            'type' => $this->mapType($this->type),
        ];
    }
    private function mapType(string $type): string
    {
        return match ($type) {
            'LP' => 'Dernières règles',
            'PS' => 'Début de grossesse',
            'PD' => 'Terme de la grossesse',
            default => $type,
        };
    }
}
