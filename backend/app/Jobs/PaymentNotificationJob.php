<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Modules\Payments\Application\Services\PaymentNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PaymentNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid, public readonly string $type) {}
    public function handle(PaymentNotificationService $notifications): void
    {
        $booking = Booking::where('uuid', $this->bookingUuid)->first();
        if ($booking) $notifications->notify($booking, $this->type);
    }
}
