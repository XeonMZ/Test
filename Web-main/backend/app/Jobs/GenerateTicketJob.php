<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Modules\Booking\Application\Services\BookingService;
use App\Modules\Booking\Domain\Events\TicketGenerated;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use App\Modules\Tickets\Application\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class GenerateTicketJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid) {}
    public function handle(BookingService $bookings, TicketService $tickets): void
    {
        $booking = $bookings->getBooking($this->bookingUuid);
        if (!$booking->ticket) $tickets->generate($booking->uuid);
        $booking->update(['status' => BookingStatus::TicketGenerated->value]);
        ActivityLog::create(['action' => 'ticket.generated', 'subject_type' => Booking::class, 'subject_id' => $booking->id, 'metadata' => ['booking_uuid' => $booking->uuid]]);
        TicketGenerated::dispatch($booking->fresh());
    }
}
