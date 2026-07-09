<?php

namespace App\Modules\Tickets\Presentation;

use App\Models\Ticket;
use App\Modules\Tickets\Application\Services\TicketService;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TicketController
{
    public function index(): JsonResponse { return response()->json(ApiResponse::success('Tickets', Ticket::latest()->limit(50)->get())); }
    public function show(string $ticket): JsonResponse { return response()->json(ApiResponse::success('Ticket detail', Ticket::with(['booking','passenger','trip'])->where('uuid', $ticket)->orWhere('id', $ticket)->firstOrFail())); }
    public function qr(string $ticket, TicketService $tickets): JsonResponse { $model = Ticket::where('uuid', $ticket)->orWhere('id', $ticket)->firstOrFail(); return response()->json(ApiResponse::success('Ticket QR', ['qr_payload'=>$tickets->qr($model->uuid)])); }
    public function verify(Request $request, TicketService $tickets): JsonResponse { $data = $request->validate(['qr_payload'=>['required','string']]); return response()->json(ApiResponse::success('Ticket valid', ['ticket'=>$tickets->validatePayload($data['qr_payload'])])); }
}
