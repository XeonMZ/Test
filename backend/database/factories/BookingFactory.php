<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

final class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'code' => 'BKG-'.fake()->unique()->bothify('##########'),
            'schedule_id' => ScheduleFactory::new(),
            'customer_id' => CustomerFactory::new(),
            'status' => 'created',
            'amount' => 150000,
            'metadata' => [],
        ];
    }
}
