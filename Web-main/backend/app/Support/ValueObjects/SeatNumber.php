<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class SeatNumber
{
    public function __construct(public string $value)
    {
        if (! preg_match('/^[A-Z0-9-]{1,8}$/', $value)) throw new InvalidArgumentException('Seat number is invalid.');
    }
}
