<?php

namespace App\Modules\Payments\Domain\Events;

use Illuminate\Foundation\Events\Dispatchable;

final readonly class PaymentSucceeded
{
    use Dispatchable;
    public function __construct(public string $paymentUuid, public string $bookingUuid) {}
}
