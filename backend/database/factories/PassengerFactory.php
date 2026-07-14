<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Passenger;
use Illuminate\Database\Eloquent\Factories\Factory;

final class PassengerFactory extends Factory
{
    protected $model = Passenger::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'booking_id' => BookingFactory::new(),
            'name' => fake()->name(),
            'identity_number' => fake()->numerify('################'),
        ];
    }
}
