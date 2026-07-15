<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Driver;
use Illuminate\Database\Eloquent\Factories\Factory;

final class DriverFactory extends Factory
{
    protected $model = Driver::class;
    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'user_id' => \Database\Factories\UserFactory::new()->state(['role' => 'driver']),
            'license_number' => 'SIM-'.fake()->unique()->numerify('########'),
            'status' => 'available',
            'metadata' => [],
        ];
    }
}
