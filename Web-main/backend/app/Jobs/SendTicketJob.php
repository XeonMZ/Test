<?php

namespace App\Jobs;

use App\Modules\Tickets\Application\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendTicketJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $ticketUuid) {}
    public function handle(TicketService $tickets): void { $tickets->markSent($this->ticketUuid); CheckInNotificationJob::dispatch($this->ticketUuid, 'sent'); }
}
