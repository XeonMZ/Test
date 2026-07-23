<?php

use App\Modules\Payments\Application\StateMachines\PaymentStateMachine;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use PHPUnit\Framework\TestCase;

final class PaymentStateMachineTest extends TestCase
{
    public function test_pending_can_be_paid(): void
    {
        $machine = new PaymentStateMachine();
        self::assertSame(PaymentStatus::Paid, $machine->transition(PaymentStatus::Pending, PaymentStatus::Paid));
    }

    public function test_failed_cannot_be_paid(): void
    {
        $this->expectException(DomainException::class);
        (new PaymentStateMachine())->transition(PaymentStatus::Failed, PaymentStatus::Paid);
    }
}
