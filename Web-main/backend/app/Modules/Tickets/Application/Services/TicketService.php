<?php

namespace App\Modules\Tickets\Application\Services;

use App\Jobs\GenerateQRCodeJob;
use App\Jobs\GenerateTicketPdfJob;
use App\Jobs\SendTicketJob;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Ticket as TicketModel;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use App\Modules\Tickets\Application\StateMachines\TicketStateMachine;
use App\Modules\Tickets\Domain\Entities\TicketRecord;
use App\Modules\Tickets\Domain\Repositories\TicketRepository;
use Illuminate\Support\Str;
use RuntimeException;

final class TicketService
{
    public function __construct(
        private readonly TicketRepository $tickets,
        private readonly QRCodeService $qrCodes,
        private readonly TicketStorageService $storage,
        private readonly TicketPdfService $pdfs,
        private readonly TicketStateMachine $states,
    ) {}

    public function generate(string $bookingUuid, string $tripUuid = '', string $passengerUuid = ''): TicketRecord
    {
        $booking = Booking::with(['passengers', 'schedule.trip'])->where('uuid', $bookingUuid)->firstOrFail();
        if (! in_array($booking->status, [BookingStatus::Paid->value, BookingStatus::TicketGenerated->value], true)) throw new RuntimeException('Booking belum siap dibuatkan ticket.');
        $passenger = $passengerUuid !== '' ? $booking->passengers->firstWhere('uuid', $passengerUuid) : $booking->passengers->first();
        if (! $passenger) throw new RuntimeException('Passenger tidak ditemukan.');
        $trip = $tripUuid !== '' ? \App\Models\Trip::where('uuid', $tripUuid)->first() : $booking->schedule?->trip;
        $ticketUuid = (string) Str::uuid();
        $ticketNumber = 'STMS-' . strtoupper(substr(str_replace('-', '', $ticketUuid), 0, 10));
        $tripUuid = $trip?->uuid ?? $booking->schedule?->uuid ?? $bookingUuid;
        $qr = $this->qrCodes->makePayload($booking->uuid, $ticketUuid, $tripUuid, $passenger->uuid);
        $path = $this->storage->storeQr($ticketUuid, $qr['payload']);
        $model = TicketModel::updateOrCreate(['booking_id' => $booking->id], ['uuid'=>$ticketUuid,'passenger_id'=>$passenger->id,'trip_id'=>$trip?->id,'ticket_number'=>$ticketNumber,'qr_code'=>$qr['payload'],'verification_token'=>$qr['token'],'qr_path'=>$path,'digital_signature'=>$qr['signature'],'status'=>'generated','expires_at'=>$booking->schedule?->departure_at?->copy()->addHours(6),'metadata'=>['correlation_id'=>\App\Support\Observability\CorrelationContext::correlationId()]]);
        ActivityLog::create(['action'=>'ticket.generated','subject_type'=>TicketModel::class,'subject_id'=>$model->id,'metadata'=>['booking_uuid'=>$booking->uuid,'ticket_uuid'=>$model->uuid,'correlation_id'=>\App\Support\Observability\CorrelationContext::correlationId()]]);
        GenerateQRCodeJob::dispatch($model->uuid);
        GenerateTicketPdfJob::dispatch($booking->uuid);
        SendTicketJob::dispatch($model->uuid);
        return $this->toEntity($model);
    }

    public function validatePayload(string $payload): TicketRecord
    {
        $decoded = $this->qrCodes->decodeAndVerify($payload);
        $ticket = TicketModel::with(['booking', 'trip', 'passenger'])->where('uuid', $decoded['ticket_uuid'])->where('verification_token', $decoded['verification_token'])->first();
        if (! $ticket) throw new RuntimeException('Ticket not found.');
        return $this->toEntity($ticket);
    }

    public function qr(string $ticketUuid): string
    {
        $ticket = TicketModel::where('uuid', $ticketUuid)->firstOrFail();
        return $ticket->qr_code;
    }

    public function markSent(string $ticketUuid): void
    {
        $ticket = TicketModel::where('uuid', $ticketUuid)->firstOrFail();
        if ($ticket->status === 'generated') $this->states->assertCanTransition('generated', 'sent');
        $ticket->update(['status'=>'sent','sent_at'=>now()]);
    }

    public function pdf(string $ticketUuid): string
    {
        $ticket = TicketModel::with('booking')->where('uuid', $ticketUuid)->firstOrFail();
        return $this->storage->storePdf($ticketUuid, $this->pdfs->render($ticket));
    }

    private function toEntity(TicketModel $ticket): TicketRecord
    {
        return new TicketRecord($ticket->uuid, $ticket->booking?->uuid ?? '', $ticket->trip?->uuid ?? '', $ticket->passenger?->uuid ?? '', $ticket->ticket_number, $ticket->qr_code, $ticket->qr_path ?? '', in_array($ticket->status, ['checked_in','boarded','completed'], true));
    }
}
