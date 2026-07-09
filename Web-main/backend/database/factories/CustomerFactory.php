<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

final class CustomerFactory extends Factory
{
    protected $model = Customer::class;
    public function definition(): array
    {
        return ['uuid' => fake()->uuid(), 'metadata' => []];
    }
}
