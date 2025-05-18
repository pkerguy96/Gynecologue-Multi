<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('patient_id')->nullable()->change(); // Allow null for phone appointments
            $table->string('phone_number')->nullable()->after('patient_id'); // Add phone number
            $table->timestamp('date')->nullable()->change(); // Allow null for date in phone consultations
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedBigInteger('patient_id')->nullable()->change(); // Allow null for phone appointments
            $table->string('phone_number')->nullable()->after('patient_id'); // Add phone number
            $table->timestamp('date')->nullable()->change(); // Allow null for date in phone consultations
        });
    }
};
