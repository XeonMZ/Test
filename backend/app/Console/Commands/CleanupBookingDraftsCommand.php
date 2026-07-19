<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Console\Command;

final class CleanupBookingDraftsCommand extends Command
{
    protected $signature = 'booking:cleanup-drafts';
    protected $description = 'Expire stale draft bookings.';
    public function handle(BookingService $bookings): int { $this->info((string) $bookings->cleanupDrafts()); return self::SUCCESS; }
}
