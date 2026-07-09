<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PickupPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

final class PickupPointFactory extends Factory
{
    protected $model = PickupPoint::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
