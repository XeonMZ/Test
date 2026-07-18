<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Schedule;
use Illuminate\Database\Eloquent\Factories\Factory;

final class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'route_id' => RouteFactory::new(),
            'driver_id' => DriverFactory::new(),
            'vehicle_id' => VehicleFactory::new(),
            'departure_at' => now()->addDay(),
            'arrival_at' => now()->addDay()->addHours(3),
            'base_fare' => 150000,
            'status' => 'scheduled',
            'metadata' => [],
        ];
    }
}
