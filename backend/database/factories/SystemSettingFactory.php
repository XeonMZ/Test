<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

final class SystemSettingFactory extends Factory
{
    protected $model = SystemSetting::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'key' => fake()->unique()->slug(3),
            'value' => ['value' => true],
            'is_public' => false,
        ];
    }
}
