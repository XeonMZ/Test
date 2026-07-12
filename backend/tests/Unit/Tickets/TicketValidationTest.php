<?php

use App\Modules\Tickets\Application\Services\TicketService;
use Tests\Support\InMemoryTicketRepository;
use App\Modules\Tickets\Infrastructure\Storage\LocalTicketStorage;
use PHPUnit\Framework\TestCase;

final class TicketValidationTest extends TestCase
{
    public function test_generated_ticket_qr_payload_is_valid(): void
    {
        $service = new TicketService(new InMemoryTicketRepository(), new LocalTicketStorage(), 'testing-secret');
        $ticket = $service->generate('booking-uuid', 'trip-uuid', 'passenger-uuid');
        self::assertSame($ticket->uuid, $service->validatePayload($ticket->qrPayload)->uuid);
    }

    public function test_invalid_qr_signature_is_rejected(): void
    {
        $this->expectException(RuntimeException::class);
        $service = new TicketService(new InMemoryTicketRepository(), new LocalTicketStorage(), 'testing-secret');
        $service->validatePayload(json_encode(['booking_uuid' => 'a', 'ticket_uuid' => 'b', 'trip_uuid' => 'c', 'passenger_uuid' => 'd', 'signature' => 'bad'], JSON_THROW_ON_ERROR));
    }
}
