<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Booking;
use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Console\Command;

final class ReleaseExpiredSeatsCommand extends Command
{
    protected $signature = 'booking:release-expired-seats';
    protected $description = 'Release expired booking seat locks.';
    public function handle(BookingService $bookings): int
    {
        Booking::whereIn('status', ['seat_locked', 'waiting_payment'])->where('expires_at', '<=', now())->pluck('uuid')->each(fn (string $uuid) => $bookings->releaseSeat($uuid));
        return self::SUCCESS;
    }
}
