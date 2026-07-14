<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

final class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'vehicle_layout_id' => VehicleLayoutFactory::new(),
            'plate_number' => fake()->unique()->bothify('? #### ??'),
            'code' => fake()->unique()->bothify('VH-####'),
            'brand' => fake()->randomElement(['Toyota', 'Mercedes', 'Isuzu']),
            'status' => 'active',
            'metadata' => [],
        ];
    }
}
