<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Console\Command;

final class ExpireBookingsCommand extends Command
{
    protected $signature = 'booking:expire-due';
    protected $description = 'Expire bookings whose seat lock countdown has elapsed.';
    public function handle(BookingService $bookings): int { $this->info((string) $bookings->expireDueBookings()); return self::SUCCESS; }
}
