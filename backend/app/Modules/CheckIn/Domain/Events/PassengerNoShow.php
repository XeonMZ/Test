<?php

namespace App\Modules\CheckIn\Domain\Events;

final readonly class PassengerNoShow
{
    public function __construct(public string $ticketUuid, public string $driverUuid, public string $recordedAt) {}
}
