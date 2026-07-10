<?php

namespace App\Modules\Tickets\Infrastructure\Repositories;

use App\Models\Ticket as TicketModel;
use App\Modules\Tickets\Domain\Entities\TicketRecord;
use App\Modules\Tickets\Domain\Repositories\TicketRepository;

final class EloquentTicketRepository implements TicketRepository
{
    public function findByUuid(string $uuid): ?TicketRecord { $model = TicketModel::with(['booking','trip','passenger'])->where('uuid', $uuid)->first(); return $model ? $this->toEntity($model) : null; }
    public function findByTicketNumber(string $ticketNumber): ?TicketRecord { $model = TicketModel::with(['booking','trip','passenger'])->where('ticket_number', $ticketNumber)->first(); return $model ? $this->toEntity($model) : null; }
    public function save(TicketRecord $ticket): TicketRecord { return $ticket; }
    private function toEntity(TicketModel $ticket): TicketRecord { return new TicketRecord($ticket->uuid, $ticket->booking?->uuid ?? '', $ticket->trip?->uuid ?? '', $ticket->passenger?->uuid ?? '', $ticket->ticket_number, $ticket->qr_code, $ticket->qr_path ?? '', in_array($ticket->status, ['checked_in','boarded','completed'], true)); }
}
