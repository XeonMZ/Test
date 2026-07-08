<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Modules\Tickets\Application\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class GenerateTicketPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $bookingUuid) {}
    public function handle(TicketService $tickets): void
    {
        $booking = Booking::with('ticket')->where('uuid', $this->bookingUuid)->first();
        if ($booking?->ticket) $tickets->pdf($booking->ticket->uuid);
    }
}
