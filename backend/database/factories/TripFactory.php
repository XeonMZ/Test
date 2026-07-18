<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

final class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'schedule_id' => ScheduleFactory::new(),
            'route_id' => RouteFactory::new(),
            'driver_id' => DriverFactory::new(),
            'vehicle_id' => VehicleFactory::new(),
            'status' => 'ready',
            'metadata' => [],
        ];
    }
}
