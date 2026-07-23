<?php

namespace App\Modules\CheckIn\Domain\Entities;

final class PassengerCheckIn
{
    public function __construct(
        public readonly string $ticketUuid,
        public readonly string $driverUuid,
        public readonly ?float $latitude,
        public readonly ?float $longitude,
        public readonly string $status,
        public readonly string $recordedAt,
    ) {}
}
