<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SeatMap;
use Illuminate\Database\Eloquent\Factories\Factory;

final class SeatMapFactory extends Factory
{
    protected $model = SeatMap::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
