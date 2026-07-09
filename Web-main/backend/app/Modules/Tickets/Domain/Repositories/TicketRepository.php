<?php

namespace App\Modules\Tickets\Domain\Repositories;

use App\Modules\Tickets\Domain\Entities\TicketRecord;

interface TicketRepository
{
    public function findByUuid(string $uuid): ?TicketRecord;
    public function findByTicketNumber(string $ticketNumber): ?TicketRecord;
    public function save(TicketRecord $ticket): TicketRecord;
}
