<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Modules\Tickets\Domain\Entities\TicketRecord;
use App\Modules\Tickets\Domain\Repositories\TicketRepository;

final class InMemoryTicketRepository implements TicketRepository
{
    /** @var array<string, TicketRecord> */
    private array $tickets = [];

    public function findByUuid(string $uuid): ?TicketRecord
    {
        return $this->tickets[$uuid] ?? null;
    }

    public function findByTicketNumber(string $ticketNumber): ?TicketRecord
    {
        foreach ($this->tickets as $ticket) {
            if ($ticket->ticketNumber === $ticketNumber) {
                return $ticket;
            }
        }

        return null;
    }

    public function save(TicketRecord $ticket): TicketRecord
    {
        $this->tickets[$ticket->uuid] = $ticket;

        return $ticket;
    }
}
