<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class TripCode
{
    public function __construct(public string $value)
    {
        if (! preg_match('/^TRP-[A-Z0-9]{6,12}$/', $value)) throw new InvalidArgumentException('Trip code is invalid.');
    }
}
