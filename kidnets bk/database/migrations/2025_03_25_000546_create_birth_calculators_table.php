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
        Schema::create('birth_calculators', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->date('date')->nullable();
            $table->integer('weeks')->nullable();
            $table->integer('days')->nullable();

            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');



            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('birth_calculators');
    }
};
