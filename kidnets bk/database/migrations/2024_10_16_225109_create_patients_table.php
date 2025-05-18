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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doctor_id');
            $table->string('nom');
            $table->string('prenom');
            $table->string('cin')->unique()->nullable();
            $table->date('date');
            $table->text('address');
            $table->enum('sex', ['male', 'female']);
            $table->string('phone_number', 20)->unique();
            $table->string('mutuelle');
            $table->text('note')->nullable();
            $table->text('p_folder')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->foreign('doctor_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
