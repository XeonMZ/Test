<?php

namespace App\Support\ValueObjects;

use InvalidArgumentException;

final readonly class QRCode
{
    public function __construct(public string $payload, public string $signature)
    {
        if ($payload === '' || $signature === '') throw new InvalidArgumentException('QR code payload and signature are required.');
    }
}
