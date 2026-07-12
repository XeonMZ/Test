<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class CheckInNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function __construct(public readonly string $ticketUuid, public readonly string $type) {}
    public function handle(): void
    {
        $ticket = Ticket::with(['booking.customer.user','trip.driver.user'])->where('uuid', $this->ticketUuid)->first();
        $targets = array_filter([$ticket?->booking?->customer?->user, $ticket?->trip?->driver?->user]);
        foreach (User::where('role', 'admin')->limit(5)->get() as $admin) $targets[] = $admin;
        foreach ($targets as $user) {
            Notification::create(['user_id'=>$user->id,'type'=>'ticket_'.$this->type,'title'=>'Ticket '.ucfirst($this->type),'body'=>'Update ticket '.$ticket->ticket_number,'metadata'=>['ticket_uuid'=>$ticket->uuid]]);
        }
    }
}
