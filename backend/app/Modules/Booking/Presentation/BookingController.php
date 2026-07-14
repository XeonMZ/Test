<?php

declare(strict_types=1);

namespace App\Modules\Booking\Presentation;

use App\Http\Requests\BookingActionRequest;
use App\Http\Requests\BookingRequest;
use App\Http\Requests\SeatLockRequest;
use App\Models\Booking;
use App\Models\User;
use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class BookingController extends Controller
{
    private const STAFF_ROLES = ['admin', 'owner'];

    public function __construct(private readonly BookingService $bookings) {}

    public function store(BookingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // Customers can only ever book for themselves; staff may book on behalf of a customer.
        if ($user && $user->role === 'customer') {
            $customerId = $user->customer?->id;
            abort_if($customerId === null, 422, 'Profil customer belum lengkap.');
            $data['customer_id'] = $customerId;
        }

        abort_if(empty($data['customer_id']), 422, 'Customer wajib ditentukan.');

        return response()->json(['success' => true, 'message' => 'Booking berhasil dibuat.', 'data' => $this->bookings->createBooking($data)], 201);
    }

    public function lockSeat(SeatLockRequest $request): JsonResponse
    {
        $uuid = $request->validated('booking_uuid');
        $this->authorizeBooking($request->user(), $uuid);

        return response()->json(['success' => true, 'message' => 'Seat berhasil dikunci.', 'data' => $this->bookings->lockSeat($uuid, $request->validated('seat_ids'))]);
    }

    public function releaseSeat(BookingActionRequest $request): JsonResponse
    {
        $uuid = $request->validated('booking_uuid');
        $this->authorizeBooking($request->user(), $uuid);

        return response()->json(['success' => true, 'message' => 'Seat berhasil dilepas.', 'data' => $this->bookings->releaseSeat($uuid)]);
    }

    public function cancel(BookingActionRequest $request): JsonResponse
    {
        $uuid = $request->validated('booking_uuid');
        $this->authorizeBooking($request->user(), $uuid);

        return response()->json(['success' => true, 'message' => 'Booking berhasil dibatalkan.', 'data' => $this->bookings->cancelBooking($uuid)]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $booking = $this->bookings->getBooking($id);
        $this->assertOwnership($request->user(), $booking->customer_id);

        return response()->json(['success' => true, 'message' => 'Booking berhasil diambil.', 'data' => $booking]);
    }

    public function customerBookings(Request $request): JsonResponse
    {
        $customerId = $request->user()?->customer?->id;
        abort_if($customerId === null, 422, 'Profil customer belum lengkap.');

        return response()->json(['success' => true, 'message' => 'Booking customer berhasil diambil.', 'data' => $this->bookings->getCustomerBookings((int) $customerId)]);
    }

    /** Guard against IDOR: a customer may only act on bookings they own. */
    private function authorizeBooking(?User $user, string $bookingUuid): void
    {
        if ($this->isStaff($user)) {
            return;
        }

        $customerId = Booking::where('uuid', $bookingUuid)->value('customer_id');
        $this->assertOwnership($user, $customerId);
    }

    private function assertOwnership(?User $user, int|string|null $ownerCustomerId): void
    {
        if ($this->isStaff($user)) {
            return;
        }

        $customerId = $user?->customer?->id;
        abort_if($customerId === null, 403, 'Profil customer tidak ditemukan.');
        abort_unless((int) $ownerCustomerId === (int) $customerId, 403, 'Booking ini bukan milik Anda.');
    }

    private function isStaff(?User $user): bool
    {
        return $user !== null && in_array($user->role, self::STAFF_ROLES, true);
    }
}
