<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PricingRule;
use Illuminate\Database\Eloquent\Factories\Factory;

final class PricingRuleFactory extends Factory
{
    protected $model = PricingRule::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
