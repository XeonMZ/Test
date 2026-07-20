<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SeatMap;
use Illuminate\Database\Eloquent\Factories\Factory;

final class SeatMapFactory extends Factory
{
    protected $model = SeatMap::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'vehicle_layout_id' => VehicleLayoutFactory::new(),
            'seat_number' => fake()->unique()->bothify('##?'),
            'row' => fake()->numberBetween(1, 6),
            'column' => fake()->numberBetween(1, 4),
            'metadata' => [],
        ];
    }
}
