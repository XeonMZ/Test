<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DropPoint;
use Illuminate\Database\Eloquent\Factories\Factory;

final class DropPointFactory extends Factory
{
    protected $model = DropPoint::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
