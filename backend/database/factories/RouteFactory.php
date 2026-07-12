<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Route;
use Illuminate\Database\Eloquent\Factories\Factory;

final class RouteFactory extends Factory
{
    protected $model = Route::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
