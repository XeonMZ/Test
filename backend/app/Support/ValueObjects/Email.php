<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class Email
{
    public function __construct(public string $value)
    {
        if (! filter_var($value, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Email is invalid.');
    }
}
