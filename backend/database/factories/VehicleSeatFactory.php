<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\VehicleSeat;
use Illuminate\Database\Eloquent\Factories\Factory;

final class VehicleSeatFactory extends Factory
{
    protected $model = VehicleSeat::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'vehicle_id' => VehicleFactory::new(),
            'seat_number' => fake()->unique()->bothify('##?'),
            'class' => 'regular',
            'is_active' => true,
        ];
    }
}
