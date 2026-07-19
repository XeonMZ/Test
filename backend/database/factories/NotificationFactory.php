<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

final class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'user_id' => UserFactory::new(),
            'type' => 'system_announcement',
            'title' => fake()->sentence(4),
            'body' => fake()->sentence(10),
            'read_at' => null,
            'metadata' => [],
        ];
    }
}
