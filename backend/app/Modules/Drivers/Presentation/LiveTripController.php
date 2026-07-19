<?php

declare(strict_types=1);

namespace App\Modules\Drivers\Presentation;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\JastipOrder;
use App\Models\Schedule;
use App\Models\Trip;
use App\Modules\Drivers\Application\Services\TripNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Live Trip Tracking endpoints.
 *
 * - Driver: manifest of their own trip + pickup/drop-off progress updates.
 * - Customer: track their own booking's driver while the trip is running.
 * - Admin/Owner: read-only live monitoring per schedule + realtime summary.
 *
 * Locations are written by the existing /driver/location endpoint (GpsService
 * + driver_locations table) and broadcast on private channel `trip.{tripId}`
 * (event `driver.location.updated`); these endpoints provide the initial
 * snapshot + polling fallback so no page depends on WebSocket availability.
 */
final class LiveTripController extends Controller
{
    private const TRIP_ACTIVE = ['started', 'pickup', 'boarding', 'on_route', 'drop_off'];
    private const BOOKING_ACTIVE = ['paid', 'ticket_generated', 'completed'];

    public function __construct(private readonly TripNotificationService $notifier) {}

    // ------------------------------- Shared -------------------------------

    /** @return array{lat: float, lng: float, recorded_at: string, speed: ?float, heading: ?float}|null */
    private function latestLocation(int $tripId): ?array
    {
        $row = DB::table('driver_locations')->where('trip_id', $tripId)->orderByDesc('id')->first();
        return $row ? [
            'lat' => (float) $row->latitude,
            'lng' => (float) $row->longitude,
            'recorded_at' => (string) $row->recorded_at,
            'speed' => $row->speed !== null ? (float) $row->speed : null,
            'heading' => $row->heading !== null ? (float) $row->heading : null,
        ] : null;
    }

    /** Recent path for the polyline (oldest→newest, capped for payload size). */
    private function path(int $tripId, int $limit = 150): array
    {
        return DB::table('driver_locations')
            ->where('trip_id', $tripId)
            ->orderByDesc('id')
            ->limit($limit)
            ->get(['latitude', 'longitude'])
            ->reverse()
            ->values()
            ->map(fn ($r) => ['lat' => (float) $r->latitude, 'lng' => (float) $r->longitude])
            ->all();
    }

    private function manifestBookings(int $scheduleId, bool $internal): array
    {
        return Booking::query()
            ->where('schedule_id', $scheduleId)
            ->whereIn('status', self::BOOKING_ACTIVE)
            ->with([
                'customer:id,user_id,phone',
                'customer.user:id,name,email',
                'seatReservations.vehicleSeat:id,seat_number',
                'payment:id,booking_id,status',
            ])
            ->orderByRaw('picked_up_at is not null, id') // not yet picked up first
            ->get()
            ->map(fn (Booking $b) => [
                'id' => $b->id,
                'code' => $b->code,
                'name' => $b->customer?->user?->name,
                'phone' => $b->customer?->phone,
                'email' => $internal ? $b->customer?->user?->email : null,
                'seats' => $b->seatReservations->map(fn ($r) => $r->vehicleSeat?->seat_number)->filter()->values(),
                'pickup' => ['label' => $b->pickup_label, 'lat' => $b->pickup_lat !== null ? (float) $b->pickup_lat : null, 'lng' => $b->pickup_lng !== null ? (float) $b->pickup_lng : null],
                'drop' => ['label' => $b->drop_label, 'lat' => $b->drop_lat !== null ? (float) $b->drop_lat : null, 'lng' => $b->drop_lng !== null ? (float) $b->drop_lng : null],
                'note' => $b->pickup_note,
                'picked_up_at' => $b->picked_up_at,
                'dropped_off_at' => $b->dropped_off_at,
                'payment_status' => $internal ? ($b->payment?->status ?? null) : null,
                'booking_status' => $b->status,
            ])->all();
    }

    private function manifestJastip(?int $driverId): array
    {
        if ($driverId === null) {
            return [];
        }
        return JastipOrder::query()
            ->where('driver_id', $driverId)
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (JastipOrder $j) => [
                'id' => $j->id,
                'code' => $j->code,
                'item_name' => $j->item_name,
                'sender_name' => $j->sender_name,
                'sender_phone' => $j->sender_phone,
                'receiver_name' => $j->receiver_name,
                'receiver_phone' => $j->receiver_phone,
                'pickup' => ['label' => $j->pickup_label, 'lat' => $j->pickup_lat !== null ? (float) $j->pickup_lat : null, 'lng' => $j->pickup_lng !== null ? (float) $j->pickup_lng : null],
                'drop' => ['label' => $j->drop_label, 'lat' => $j->drop_lat !== null ? (float) $j->drop_lat : null, 'lng' => $j->drop_lng !== null ? (float) $j->drop_lng : null],
                'status' => $j->status,
                'picked_up_at' => $j->picked_up_at,
                'delivered_at' => $j->delivered_at,
            ])->all();
    }

    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = \App\Support\Audit\RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'Trip', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => $action, 'subject_type' => 'Trip', 'subject_id' => $meta['trip_id'] ?? null, 'metadata' => $meta]);
    }

    // ------------------------------- Driver -------------------------------

    private function ownedTrip(Request $request, string $tripId): Trip
    {
        $driver = Driver::where('user_id', $request->user()?->id)->firstOrFail();
        $trip = Trip::with(['schedule.route:id,code,origin,destination', 'vehicle:id,code,brand,plate_number'])->findOrFail($tripId);
        abort_unless($trip->driver_id === $driver->id, 403, 'Trip ini bukan milik Anda.');
        return $trip;
    }

    /** Full manifest for the driver's live-trip screen. */
    public function driverManifest(Request $request, string $tripId): JsonResponse
    {
        $trip = $this->ownedTrip($request, $tripId);
        return response()->json(['data' => [
            'trip' => ['id' => $trip->id, 'uuid' => $trip->uuid, 'status' => $trip->status, 'active' => in_array($trip->status, self::TRIP_ACTIVE, true)],
            'route' => $trip->schedule?->route,
            'vehicle' => $trip->vehicle,
            'bookings' => $this->manifestBookings((int) $trip->schedule_id, internal: false),
            'jastip' => $this->manifestJastip((int) $trip->driver_id),
            'location' => $this->latestLocation($trip->id),
            'path' => $this->path($trip->id),
        ]]);
    }

    /** Mark a passenger as picked up. */
    public function pickupBooking(Request $request, string $tripId, string $bookingId): JsonResponse
    {
        return $this->progressBooking($request, $tripId, $bookingId, 'pickup');
    }

    /** Mark a passenger as dropped off. */
    public function dropoffBooking(Request $request, string $tripId, string $bookingId): JsonResponse
    {
        return $this->progressBooking($request, $tripId, $bookingId, 'dropoff');
    }

    private function progressBooking(Request $request, string $tripId, string $bookingId, string $stage): JsonResponse
    {
        $trip = $this->ownedTrip($request, $tripId);
        abort_unless(in_array($trip->status, self::TRIP_ACTIVE, true), 422, 'Trip tidak sedang berjalan.');

        $booking = Booking::with('customer.user:id,name')
            ->where('schedule_id', $trip->schedule_id)
            ->whereIn('status', self::BOOKING_ACTIVE)
            ->findOrFail($bookingId);

        if ($stage === 'pickup') {
            // Atomic guard: WHERE picked_up_at IS NULL makes concurrent taps
            // race-safe — only one request wins; the other affects 0 rows.
            $updated = Booking::whereKey($booking->id)->whereNull('picked_up_at')->update(['picked_up_at' => now()]);
            abort_if($updated === 0, 422, 'Penumpang sudah ditandai dijemput.');
            $this->audit($request, 'trip.passenger_picked_up', ['trip_id' => $trip->id, 'booking_id' => $booking->id, 'booking_code' => $booking->code]);
            $this->notifier->notifyBooking($booking, 'Anda sudah dijemput', "Driver telah menjemput Anda untuk booking {$booking->code}. Selamat menikmati perjalanan!");
        } else {
            abort_if($booking->picked_up_at === null, 422, 'Penumpang belum dijemput.');
            $updated = Booking::whereKey($booking->id)->whereNotNull('picked_up_at')->whereNull('dropped_off_at')->update(['dropped_off_at' => now()]);
            abort_if($updated === 0, 422, 'Penumpang sudah ditandai diantar.');
            $this->audit($request, 'trip.passenger_dropped_off', ['trip_id' => $trip->id, 'booking_id' => $booking->id, 'booking_code' => $booking->code]);
            $this->notifier->notifyBooking($booking, 'Anda sudah tiba di tujuan', "Terima kasih! Booking {$booking->code} telah selesai diantar. Sampai jumpa di perjalanan berikutnya.");
        }

        return response()->json(['data' => $booking->fresh()]);
    }

    // ------------------------------ Customer ------------------------------

    /**
     * Track the driver for the customer's own booking. Only available while
     * the trip is actively running; never exposes other passengers, the
     * manifest, or jastip data.
     */
    public function customerTrack(Request $request, string $bookingUuid): JsonResponse
    {
        $customer = Customer::where('user_id', $request->user()?->id)->firstOrFail();
        $booking = Booking::query()
            ->where('uuid', $bookingUuid)
            ->where('customer_id', $customer->id) // IDOR guard: own booking only
            ->whereIn('status', self::BOOKING_ACTIVE)
            ->firstOrFail();

        $trip = Trip::with(['driver:id,phone,photo_path', 'driver.user:id,name', 'vehicle:id,code,brand,plate_number', 'schedule.route:id,origin,destination'])
            ->where('schedule_id', $booking->schedule_id)
            ->latest('id')
            ->first();

        $active = $trip !== null && in_array($trip->status, self::TRIP_ACTIVE, true);
        if (! $active) {
            // Trip not started or already finished: tracking is closed.
            return response()->json(['data' => [
                'active' => false,
                'trip_status' => $trip?->status,
                'completed' => $trip?->status === 'completed' || $booking->dropped_off_at !== null,
            ]]);
        }

        $location = $this->latestLocation($trip->id);

        // ETA without the paid Directions API: haversine distance to the next
        // relevant point ÷ recent speed (fallback 30 km/h town average).
        $target = $booking->picked_up_at === null
            ? [$booking->pickup_lat, $booking->pickup_lng]
            : [$booking->drop_lat, $booking->drop_lng];
        $etaMinutes = null;
        if ($location && $target[0] !== null && $target[1] !== null) {
            $km = $this->haversineKm($location['lat'], $location['lng'], (float) $target[0], (float) $target[1]);
            $speedKmh = max(10.0, min(90.0, ($location['speed'] ?? 0) > 1 ? (float) $location['speed'] * 3.6 : 30.0));
            $etaMinutes = (int) max(1, round($km / $speedKmh * 60));
        }

        return response()->json(['data' => [
            'active' => true,
            'trip' => ['id' => $trip->id, 'uuid' => $trip->uuid, 'status' => $trip->status],
            'driver' => [
                'name' => $trip->driver?->user?->name,
                'photo' => $trip->driver?->photo_path ? asset('storage/'.$trip->driver->photo_path) : null,
            ],
            'vehicle' => ['brand' => $trip->vehicle?->brand, 'plate_number' => $trip->vehicle?->plate_number, 'code' => $trip->vehicle?->code],
            'route' => $trip->schedule?->route?->only(['origin', 'destination']),
            'booking' => [
                'code' => $booking->code,
                'picked_up_at' => $booking->picked_up_at,
                'dropped_off_at' => $booking->dropped_off_at,
                'pickup' => ['label' => $booking->pickup_label, 'lat' => $booking->pickup_lat !== null ? (float) $booking->pickup_lat : null, 'lng' => $booking->pickup_lng !== null ? (float) $booking->pickup_lng : null],
                'drop' => ['label' => $booking->drop_label, 'lat' => $booking->drop_lat !== null ? (float) $booking->drop_lat : null, 'lng' => $booking->drop_lng !== null ? (float) $booking->drop_lng : null],
            ],
            'location' => $location,
            'path' => $this->path($trip->id, 60),
            'eta_minutes' => $etaMinutes,
        ]]);
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return 2 * $r * asin(min(1.0, sqrt($a)));
    }

    // ---------------------------- Admin / Owner ----------------------------

    /** Read-only live monitor for one schedule (full manifest incl. payment). */
    public function scheduleLive(string $scheduleId): JsonResponse
    {
        $schedule = Schedule::with(['route:id,code,origin,destination', 'driver:id,phone', 'driver.user:id,name', 'vehicle:id,code,brand,plate_number'])->findOrFail($scheduleId);
        $trip = Trip::where('schedule_id', $schedule->id)->latest('id')->first();

        return response()->json(['data' => [
            'schedule' => ['id' => $schedule->id, 'uuid' => $schedule->uuid, 'departure_at' => $schedule->departure_at, 'status' => $schedule->status, 'route' => $schedule->route],
            'driver' => ['name' => $schedule->driver?->user?->name, 'phone' => $schedule->driver?->phone],
            'vehicle' => $schedule->vehicle,
            'trip' => $trip ? ['id' => $trip->id, 'uuid' => $trip->uuid, 'status' => $trip->status, 'active' => in_array($trip->status, self::TRIP_ACTIVE, true)] : null,
            'bookings' => $this->manifestBookings((int) $schedule->id, internal: true),
            'jastip' => $this->manifestJastip($schedule->driver_id !== null ? (int) $schedule->driver_id : null),
            'location' => $trip ? $this->latestLocation($trip->id) : null,
            'path' => $trip ? $this->path($trip->id) : [],
        ]]);
    }

    /** Realtime dashboard summary: drivers/trips/customers/packages in motion. */
    public function liveSummary(): JsonResponse
    {
        $activeTrips = Trip::whereIn('status', self::TRIP_ACTIVE);
        return response()->json(['data' => [
            'active_trips' => (clone $activeTrips)->count(),
            'active_drivers' => (clone $activeTrips)->distinct('driver_id')->count('driver_id'),
            'customers_in_transit' => Booking::whereNotNull('picked_up_at')->whereNull('dropped_off_at')->count(),
            'packages_in_transit' => JastipOrder::whereIn('status', ['assigned', 'picked_up'])->count(),
        ]]);
    }
}
