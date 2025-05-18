<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class doctorfile extends Model
{
    use HasFactory;
    protected $guarded = [];

    public function doctorfile()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}
