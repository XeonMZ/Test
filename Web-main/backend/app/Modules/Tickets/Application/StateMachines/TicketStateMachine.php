<?php

namespace App\Modules\Tickets\Application\StateMachines;

use DomainException;

final class TicketStateMachine
{
    private const TRANSITIONS = [
        'generated' => ['sent', 'cancelled', 'expired'],
        'sent' => ['checked_in', 'no_show', 'cancelled', 'expired'],
        'checked_in' => ['boarded', 'no_show'],
        'boarded' => ['completed'],
        'no_show' => [],
        'completed' => [],
        'cancelled' => [],
        'expired' => [],
    ];

    public function assertCanTransition(string $from, string $to): void
    {
        if (! in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
            throw new DomainException("Invalid ticket transition from {$from} to {$to}");
        }
    }
}
