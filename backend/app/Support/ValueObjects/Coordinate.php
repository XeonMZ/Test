<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class Coordinate
{
    public function __construct(public float $latitude, public float $longitude)
    {
        if ($latitude < -90 || $latitude > 90) throw new InvalidArgumentException('Latitude is invalid.');
        if ($longitude < -180 || $longitude > 180) throw new InvalidArgumentException('Longitude is invalid.');
    }
}
