<?php

namespace App\Support\Exceptions;

use DomainException;

final class DriverException extends DomainException
{
    public static function invalid(string $message): self { return new self($message); }
}
