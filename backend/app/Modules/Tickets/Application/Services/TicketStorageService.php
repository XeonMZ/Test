<?php

namespace App\Modules\Tickets\Application\Services;

use App\Modules\Tickets\Infrastructure\Storage\TicketStorage;

final class TicketStorageService
{
    public function __construct(private readonly TicketStorage $storage) {}
    public function storeQr(string $ticketUuid, string $payload): string { return $this->storage->put('tickets/qr/'.$ticketUuid.'.json', $payload); }
    public function storePdf(string $ticketUuid, string $contents): string { return $this->storage->put('tickets/pdf/'.$ticketUuid.'.pdf', $contents); }
}
