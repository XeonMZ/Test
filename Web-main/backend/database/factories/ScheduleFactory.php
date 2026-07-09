<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Schedule;
use Illuminate\Database\Eloquent\Factories\Factory;

final class ScheduleFactory extends Factory
{
    protected $model = Schedule::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
