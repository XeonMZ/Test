<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SeatReservation;
use Illuminate\Database\Eloquent\Factories\Factory;

final class SeatReservationFactory extends Factory
{
    protected $model = SeatReservation::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
