<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;

final class VoucherFactory extends Factory
{
    protected $model = Voucher::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'promo_id' => PromoFactory::new(),
            'code' => fake()->unique()->bothify('VCR-######'),
            'is_active' => true,
        ];
    }
}
