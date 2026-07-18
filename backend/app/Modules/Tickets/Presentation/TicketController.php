<?php

declare(strict_types=1);

namespace App\Modules\Tickets\Presentation;

use App\Models\Ticket;
use App\Models\User;
use App\Modules\Tickets\Application\Services\TicketService;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TicketController
{
    /** Roles allowed to read any ticket in the system. */
    private const STAFF_ROLES = ['admin', 'owner', 'driver'];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Ticket::query()
            ->with(['booking:id,uuid,code,customer_id,schedule_id'])
            ->latest()
            ->limit(50);

        // Customers only ever see their own tickets.
        if (! $this->isStaff($user)) {
            $customerId = $user?->customer?->id;
            if ($customerId === null) {
                return response()->json(ApiResponse::success('Tickets', []));
            }
            $query->whereHas('booking', fn ($q) => $q->where('customer_id', $customerId));
        }

        return response()->json(ApiResponse::success('Tickets', $query->get()));
    }

    public function show(Request $request, string $ticket): JsonResponse
    {
        $model = $this->resolve($ticket, ['booking.schedule.route', 'booking.schedule.vehicle', 'passenger', 'trip']);
        $this->authorizeTicket($request->user(), $model);

        return response()->json(ApiResponse::success('Ticket detail', $model));
    }

    public function qr(Request $request, string $ticket, TicketService $tickets): JsonResponse
    {
        $model = $this->resolve($ticket, ['booking']);
        $this->authorizeTicket($request->user(), $model);

        return response()->json(ApiResponse::success('Ticket QR', ['qr_payload' => $tickets->qr($model->uuid)]));
    }

    public function verify(Request $request, TicketService $tickets): JsonResponse
    {
        $data = $request->validate(['qr_payload' => ['required', 'string']]);

        return response()->json(ApiResponse::success('Ticket valid', ['ticket' => $tickets->validatePayload($data['qr_payload'])]));
    }

    /** @param array<int, string> $with */
    private function resolve(string $ticket, array $with): Ticket
    {
        return Ticket::with($with)
            ->where(fn ($query) => $query->where('uuid', $ticket)->orWhere('id', $ticket))
            ->firstOrFail();
    }

    private function authorizeTicket(?User $user, Ticket $ticket): void
    {
        if ($this->isStaff($user)) {
            return;
        }

        abort_unless($user?->customer?->id !== null && $ticket->booking?->customer_id === $user->customer->id, 403, 'Tiket ini bukan milik Anda.');
    }

    private function isStaff(?User $user): bool
    {
        return $user !== null && in_array($user->role, self::STAFF_ROLES, true);
    }
}
