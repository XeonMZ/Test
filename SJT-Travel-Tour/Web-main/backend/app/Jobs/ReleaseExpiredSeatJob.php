<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ReleaseExpiredSeatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid) {}
    public function handle(BookingService $bookings): void { $bookings->releaseSeat($this->bookingUuid); }
}
