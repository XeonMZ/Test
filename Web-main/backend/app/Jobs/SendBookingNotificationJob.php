<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Modules\Booking\Application\Services\BookingNotificationService;
use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendBookingNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid, public readonly string $type) {}
    public function handle(BookingService $bookings, BookingNotificationService $notifications): void
    {
        $booking = $bookings->getBooking($this->bookingUuid);
        match ($this->type) {
            'created' => [$notifications->notifyCustomer($booking, 'booking_created', 'Booking berhasil', 'Booking Anda berhasil dibuat.'), $notifications->notifyDriver($booking), $notifications->notifyAdmins($booking)],
            'expired' => $notifications->notifyCustomer($booking, 'booking_expired', 'Booking expired', 'Booking Anda telah expired.'),
            'paid' => $notifications->notifyCustomer($booking, 'payment_success', 'Pembayaran berhasil', 'Pembayaran booking berhasil.'),
            'payment_failed' => $notifications->notifyCustomer($booking, 'payment_failed', 'Pembayaran gagal', 'Pembayaran booking gagal.'),
            default => null,
        };
    }
}
