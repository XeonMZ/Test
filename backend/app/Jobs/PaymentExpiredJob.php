<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Modules\Payments\Application\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PaymentExpiredJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $paymentUuid) {}
    public function handle(PaymentService $payments): void
    {
        // The sync queue driver ignores delays; without this time guard a
        // payment would be expired immediately after creation. The scheduled
        // booking expiry sweep covers any run that is skipped here.
        $payment = Payment::where('uuid', $this->paymentUuid)->first();
        if ($payment === null) return;
        if ($payment->expires_at !== null && now()->lt($payment->expires_at)) return;

        $payments->expire($this->paymentUuid);
    }
}
