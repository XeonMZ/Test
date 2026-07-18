<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VehicleLayout;
use Illuminate\Database\Eloquent\Factories\Factory;

final class VehicleLayoutFactory extends Factory
{
    protected $model = VehicleLayout::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'name' => 'Layout '.fake()->unique()->bothify('??-###'),
            'capacity' => 12,
            'metadata' => [],
        ];
    }
}
