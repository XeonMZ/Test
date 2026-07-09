<?php

namespace App\Jobs;

use App\Models\Payment;
use App\Modules\Payments\Domain\ValueObjects\PaymentStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PaymentReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $paymentUuid) {}
    public function handle(): void
    {
        $payment = Payment::with('booking')->where('uuid', $this->paymentUuid)->first();
        if ($payment?->status === PaymentStatus::Pending->value && $payment->booking) {
            PaymentNotificationJob::dispatch($payment->booking->uuid, 'reminder');
        }
    }
}
