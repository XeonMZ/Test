<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class VehiclePlate
{
    public function __construct(public string $value)
    {
        if (! preg_match('/^[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{0,3}$/', $value)) throw new InvalidArgumentException('Vehicle plate is invalid.');
    }
}
