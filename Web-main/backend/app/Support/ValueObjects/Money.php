<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class Money
{
    public function __construct(public int $amount, public string $currency)
    {
        if ($amount < 0) throw new InvalidArgumentException('Money amount cannot be negative.');
        if ($currency === '') throw new InvalidArgumentException('Currency is required.');
    }
}
