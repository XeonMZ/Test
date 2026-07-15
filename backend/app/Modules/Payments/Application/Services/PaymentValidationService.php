<?php

namespace App\Modules\Payments\Application\Services;

use App\Models\Booking;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use InvalidArgumentException;

final class PaymentValidationService
{
    public function validateCreate(Booking $booking, string $method, int $amount): void
    {
        if (! in_array($method, ['snap', 'qris', 'bank_transfer', 'va'], true)) {
            throw new InvalidArgumentException('Metode pembayaran tidak didukung.');
        }
        if (! in_array($booking->status, [BookingStatus::SeatLocked->value, BookingStatus::WaitingPayment->value], true)) {
            throw new InvalidArgumentException('Booking tidak dapat dibayar pada status saat ini.');
        }
        if ($amount !== (int) $booking->amount) {
            throw new InvalidArgumentException('Nominal pembayaran tidak sesuai booking.');
        }
    }
}
