<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(), // Assumes a Patient factory exists
            'date' => $this->faker->dateTimeBetween('now', '+1 year'), // Always future dates
            'note' => $this->faker->optional()->sentence(),
        ];
    }
}
