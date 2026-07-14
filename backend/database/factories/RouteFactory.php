<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Route;
use Illuminate\Database\Eloquent\Factories\Factory;

final class RouteFactory extends Factory
{
    protected $model = Route::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'code' => fake()->unique()->bothify('RT-###'),
            'origin' => fake()->city(),
            'destination' => fake()->city(),
            'distance_km' => fake()->numberBetween(20, 500),
            'duration_minutes' => fake()->numberBetween(60, 600),
        ];
    }
}
