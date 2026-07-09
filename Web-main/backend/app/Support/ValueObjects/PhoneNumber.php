<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class PhoneNumber
{
    public function __construct(public string $value)
    {
        if (! preg_match('/^\+?[0-9]{8,15}$/', $value)) throw new InvalidArgumentException('Phone number is invalid.');
    }
}
