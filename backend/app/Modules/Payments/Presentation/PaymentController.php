<?php

declare(strict_types=1);

namespace App\Modules\Payments\Presentation;

use App\Models\Booking;
use App\Models\User;
use App\Modules\Payments\Application\Services\PaymentService;
use App\Modules\Payments\Application\Services\PaymentWebhookService;
use App\Modules\Payments\Domain\Repositories\PaymentRepository;
use App\Support\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

final class PaymentController
{
    private const STAFF_ROLES = ['admin', 'owner'];

    public function store(Request $request, PaymentService $payments): JsonResponse
    {
        $data = $request->validate([
            'booking_uuid' => ['required', 'string'],
            'amount' => ['required', 'integer', 'min:1'],
            'method' => ['required', 'string', 'in:qris,virtual_account,va,bank_transfer,ewallet,snap'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'payment_type' => ['nullable', 'string', 'in:full,dp,settlement'],
        ]);

        $this->authorizeBooking($request->user(), $data['booking_uuid']);

        $result = $payments->createPayment(
            $data['booking_uuid'],
            (int) $data['amount'],
            $data['method'],
            $data['idempotency_key'] ?? $request->header('Idempotency-Key', sha1(json_encode($data))),
            $data['payment_type'] ?? 'full',
        );

        return response()->json(ApiResponse::success('Payment created', $result, 201), 201);
    }

    public function show(Request $request, string $payment, PaymentRepository $payments): JsonResponse
    {
        $entity = $payments->findByUuid($payment);
        abort_if($entity === null, 404, 'Pembayaran tidak ditemukan.');

        $this->authorizeBooking($request->user(), $entity->bookingUuid);

        return response()->json(ApiResponse::success('Payment status', ['payment' => $entity]));
    }

    public function webhook(Request $request, PaymentWebhookService $handler): JsonResponse
    {
        try {
            $payment = $handler->handle($request->all());
        } catch (Throwable $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage(), 'data' => []], 422);
        }

        return response()->json(ApiResponse::success('Webhook processed', ['payment' => $payment]));
    }

    /** Customers may only touch payments belonging to their own bookings. */
    private function authorizeBooking(?User $user, string $bookingUuid): void
    {
        if ($user !== null && in_array($user->role, self::STAFF_ROLES, true)) {
            return;
        }

        $customerId = $user?->customer?->id;
        abort_if($customerId === null, 403, 'Profil customer tidak ditemukan.');

        $owns = Booking::where('uuid', $bookingUuid)->where('customer_id', $customerId)->exists();
        abort_unless($owns, 403, 'Booking ini bukan milik Anda.');
    }
}
