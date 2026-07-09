<?php

namespace App\Modules\Payments\Presentation;

use App\Modules\Payments\Application\Services\PaymentService;
use App\Modules\Payments\Application\Services\PaymentWebhookService;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

final class PaymentController
{
    public function store(Request $request, PaymentService $payments): JsonResponse
    {
        $data = $request->validate(['booking_uuid' => ['required', 'string'], 'amount' => ['required', 'integer', 'min:1'], 'method' => ['required', 'string'], 'idempotency_key' => ['nullable', 'string']]);
        $result = $payments->createPayment($data['booking_uuid'], (int) $data['amount'], $data['method'], $data['idempotency_key'] ?? $request->header('Idempotency-Key', sha1(json_encode($data))));
        return response()->json(ApiResponse::success('Payment created', $result, 201), 201);
    }

    public function show(string $payment, \App\Modules\Payments\Domain\Repositories\PaymentRepository $payments): JsonResponse
    {
        $entity = $payments->findByUuid($payment);
        return response()->json(ApiResponse::success('Payment status', ['payment' => $entity]));
    }

    public function webhook(Request $request, PaymentWebhookService $handler): JsonResponse
    {
        try { $payment = $handler->handle($request->all()); }
        catch (Throwable $exception) { return response()->json(['success' => false, 'message' => $exception->getMessage(), 'data' => []], 422); }
        return response()->json(ApiResponse::success('Webhook processed', ['payment' => $payment]));
    }
}
