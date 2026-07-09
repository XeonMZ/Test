<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Factories\Factory;

final class ActivityLogFactory extends Factory
{
    protected $model = ActivityLog::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
