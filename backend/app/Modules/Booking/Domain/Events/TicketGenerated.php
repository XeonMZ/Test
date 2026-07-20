<?php

declare(strict_types=1);

namespace App\Modules\Booking\Domain\Events;

use App\Models\Booking;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class TicketGenerated { use Dispatchable, SerializesModels; public function __construct(public readonly Booking $booking) {} }
