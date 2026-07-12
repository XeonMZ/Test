<?php

namespace App\Modules\Payments\Domain\Entities;

use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use DateTimeInterface;

final class PaymentRecord
{
    /** @param array<string, mixed> $gatewayPayload */
    public function __construct(
        public readonly string $uuid,
        public readonly string $bookingUuid,
        public readonly int $amount,
        public readonly string $method,
        public readonly PaymentStatus $status,
        public readonly string $idempotencyKey,
        public readonly ?string $gatewayReference = null,
        public readonly null|string|DateTimeInterface $expiresAt = null,
        public readonly null|string|DateTimeInterface $paidAt = null,
        public readonly null|string|DateTimeInterface $failedAt = null,
        public readonly array $gatewayPayload = [],
    ) {}
}
