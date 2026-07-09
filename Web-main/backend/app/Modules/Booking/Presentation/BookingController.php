<?php

declare(strict_types=1);

namespace App\Modules\Booking\Presentation;

use App\Http\Requests\BookingActionRequest;
use App\Http\Requests\BookingRequest;
use App\Http\Requests\SeatLockRequest;
use App\Modules\Booking\Application\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookings) {}

    public function store(BookingRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Booking berhasil dibuat.', 'data' => $this->bookings->createBooking($request->validated())], 201);
    }

    public function lockSeat(SeatLockRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Seat berhasil dikunci.', 'data' => $this->bookings->lockSeat($request->validated('booking_uuid'), $request->validated('seat_ids'))]);
    }

    public function releaseSeat(BookingActionRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Seat berhasil dilepas.', 'data' => $this->bookings->releaseSeat($request->validated('booking_uuid'))]);
    }

    public function cancel(BookingActionRequest $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Booking berhasil dibatalkan.', 'data' => $this->bookings->cancelBooking($request->validated('booking_uuid'))]);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Booking berhasil diambil.', 'data' => $this->bookings->getBooking($id)]);
    }

    public function customerBookings(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'Booking customer berhasil diambil.', 'data' => $this->bookings->getCustomerBookings((int) $request->user()->customer->id)]);
    }
}
