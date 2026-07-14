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
        if ($payment?->status !== PaymentStatus::Pending->value || ! $payment->booking) return;
        // Sync queues ignore delays — don't nag the customer the instant the
        // payment is created; only remind once the reminder window elapsed.
        $reminderMinutes = max(1, (int) config('payment.reminder_minutes', 10));
        if ($payment->created_at !== null && now()->lt($payment->created_at->addMinutes($reminderMinutes))) return;

        PaymentNotificationJob::dispatch($payment->booking->uuid, 'reminder');
    }
}
