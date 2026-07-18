<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Promo;
use Illuminate\Database\Eloquent\Factories\Factory;

final class PromoFactory extends Factory
{
    protected $model = Promo::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'code' => fake()->unique()->bothify('PRM-####'),
            'name' => fake()->words(2, true),
            'amount' => 10000,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ];
    }
}
