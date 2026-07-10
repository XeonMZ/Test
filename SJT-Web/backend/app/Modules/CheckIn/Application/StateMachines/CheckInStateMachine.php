<?php

namespace App\Modules\CheckIn\Application\StateMachines;

use DomainException;

class CheckInStateMachine
{
    private const TRANSITIONS = [
        'sent' => ['checked_in', 'no_show'],
        'checked_in' => ['boarded', 'no_show'],
        'boarded' => ['completed'],
    ];

    public function assertCanTransition(string $from, string $to): void
    {
        if (! in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
            throw new DomainException("Invalid check-in transition from {$from} to {$to}");
        }
    }
}
