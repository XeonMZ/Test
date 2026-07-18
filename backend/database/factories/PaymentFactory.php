<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

final class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'booking_id' => BookingFactory::new(),
            'provider' => 'beta',
            'reference' => fake()->unique()->uuid(),
            'amount' => 150000,
            'status' => 'pending',
            'metadata' => [],
        ];
    }
}
