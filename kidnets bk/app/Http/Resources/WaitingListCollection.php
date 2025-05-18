<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Carbon;

class WaitingListCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request)
    {
        return $this->collection->map(function ($waiting) {
            $entryTime = Carbon::parse($waiting->entry_time); // Parse entry_time
            $now = Carbon::now(); // Get the current time
            $duration = $entryTime->diff($now); // Calculate the difference

            // Format the waiting time as "Xh Ymin"
            $waitingTime = sprintf('%dh %dmin', $duration->h, $duration->i);
            // Retrieve the last visit date
            $lastVisit = optional($waiting->patient->operations->first())->created_at;
            $lastVisitFormatted = $lastVisit ? Carbon::parse($lastVisit)->format('Y-m-d H:i') : 'Jamais';
            return [
                'id' => $waiting->id,
                'patient_id' =>  $waiting->patient->id,
                'patient_name' =>  $waiting->patient->nom . " " . $waiting->patient->prenom,
                'entry_time' => $waiting->entry_time,
                'waiting_time' => $waitingTime,
                'visit_reason' => $waiting->visit_reason ?? 'Non spécifié',
                'status' =>
                $waiting->status,
                'last_visit' => $lastVisitFormatted,
                'count' => $waiting->count

            ];
        });
    }
}
