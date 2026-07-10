<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class BookingCode
{
    public function __construct(public string $value)
    {
        if (! preg_match('/^STMS-BKG-[A-Z0-9]{6,12}$/', $value)) throw new InvalidArgumentException('Booking code is invalid.');
    }
}
