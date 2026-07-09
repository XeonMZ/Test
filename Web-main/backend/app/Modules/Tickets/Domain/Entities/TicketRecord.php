<?php

namespace App\Modules\Tickets\Domain\Entities;

final class TicketRecord
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $bookingUuid,
        public readonly string $tripUuid,
        public readonly string $passengerUuid,
        public readonly string $ticketNumber,
        public readonly string $qrPayload,
        public readonly string $qrPath,
        public readonly bool $checkedIn = false,
    ) {}
}
