<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class observation extends Model
{
    use HasFactory;
    protected $guarded = [];
    public function Operation()
    {
        return $this->belongsTo(Operation::class, 'operation_id');
    }
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id')->withTrashed();
    }
}
