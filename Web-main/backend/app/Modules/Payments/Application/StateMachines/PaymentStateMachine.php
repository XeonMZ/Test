<?php

namespace App\Modules\Payments\Application\StateMachines;

use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use DomainException;

final class PaymentStateMachine
{
    private const TRANSITIONS = [
        'pending' => ['paid', 'failed', 'expired'],
        'paid' => ['refunded', 'partial_refunded'],
        'failed' => [],
        'expired' => [],
        'refunded' => [],
        'partial_refunded' => ['refunded'],
    ];

    public function assertCanTransition(PaymentStatus $from, PaymentStatus $to): void
    {
        if (! in_array($to->value, self::TRANSITIONS[$from->value], true)) {
            throw new DomainException("Invalid payment transition from {$from->value} to {$to->value}");
        }
    }

    public function transition(PaymentStatus $from, PaymentStatus $to): PaymentStatus
    {
        $this->assertCanTransition($from, $to);
        return $to;
    }
}
