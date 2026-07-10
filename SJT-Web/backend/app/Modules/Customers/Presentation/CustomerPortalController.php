<?php

declare(strict_types=1);

namespace App\Modules\Customers\Presentation;

use App\Models\Booking;
use App\Models\Membership;
use App\Models\Notification;
use App\Models\Promo;
use App\Models\Trip;
use App\Modules\Gps\Application\GpsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Customer-facing portal data: promos, membership, notifications, and
 * live trip tracking. Every record is scoped to the authenticated user.
 */
final class CustomerPortalController extends Controller
{
    /** Booking must be paid before its trip can be tracked. */
    private const TRACKABLE_STATUSES = ['paid', 'ticket_generated', 'completed'];

    public function promos(): JsonResponse
    {
        $now = now();

        $promos = Promo::query()
            ->with(['vouchers' => fn ($q) => $q->where('is_active', true)->select('id', 'promo_id', 'code', 'is_active')])
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->orderBy('ends_at')
            ->get(['id', 'uuid', 'code', 'name', 'amount', 'starts_at', 'ends_at']);

        return response()->json(['success' => true, 'message' => 'Promo aktif berhasil diambil.', 'data' => $promos]);
    }

    public function promoShow(string $promo): JsonResponse
    {
        $model = Promo::query()
            ->with(['vouchers' => fn ($q) => $q->where('is_active', true)->select('id', 'promo_id', 'code', 'is_active')])
            ->where(fn ($q) => $q->where('uuid', $promo)->orWhere('code', $promo))
            ->firstOrFail(['id', 'uuid', 'code', 'name', 'amount', 'starts_at', 'ends_at']);

        return response()->json(['success' => true, 'message' => 'Detail promo berhasil diambil.', 'data' => $model]);
    }

    public function membership(Request $request): JsonResponse
    {
        $customerId = $request->user()?->customer?->id;
        abort_if($customerId === null, 422, 'Profil customer belum lengkap.');

        // A brand-new customer simply starts at the base tier.
        $membership = Membership::firstOrCreate(
            ['customer_id' => $customerId],
            ['level' => 'bronze', 'points' => 0],
        );

        $totalTrips = Booking::where('customer_id', $customerId)->where('status', 'completed')->count();

        return response()->json(['success' => true, 'message' => 'Membership berhasil diambil.', 'data' => [
            'membership' => $membership->only(['uuid', 'level', 'points', 'created_at']),
            'completed_trips' => $totalTrips,
        ]]);
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(100)
            ->get(['id', 'uuid', 'type', 'title', 'body', 'read_at', 'created_at']);

        return response()->json(['success' => true, 'message' => 'Notifikasi berhasil diambil.', 'data' => [
            'items' => $notifications,
            'unread' => $notifications->whereNull('read_at')->count(),
        ]]);
    }

    public function markNotificationRead(Request $request, string $notification): JsonResponse
    {
        $model = Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('uuid', $notification)
            ->firstOrFail();

        $model->update(['read_at' => $model->read_at ?? now()]);

        return response()->json(['success' => true, 'message' => 'Notifikasi ditandai dibaca.', 'data' => $model->only(['uuid', 'read_at'])]);
    }

    public function markAllNotificationsRead(Request $request): JsonResponse
    {
        $updated = Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Semua notifikasi ditandai dibaca.', 'data' => ['updated' => $updated]]);
    }

    public function tracking(Request $request, string $booking, GpsService $gps): JsonResponse
    {
        $customerId = $request->user()?->customer?->id;
        abort_if($customerId === null, 403, 'Profil customer tidak ditemukan.');

        $model = Booking::query()
            ->with(['schedule.route:id,code,origin,destination', 'schedule.vehicle:id,code,brand'])
            ->where('uuid', $booking)
            ->where('customer_id', $customerId)
            ->firstOrFail();

        abort_unless(in_array($model->status, self::TRACKABLE_STATUSES, true), 422, 'Booking belum dapat dilacak sebelum pembayaran selesai.');

        $trip = Trip::query()->where('schedule_id', $model->schedule_id)->latest()->first();
        $location = $trip ? $gps->lastKnownLocation((string) $trip->id) : null;

        return response()->json(['success' => true, 'message' => 'Status perjalanan berhasil diambil.', 'data' => [
            'booking' => ['uuid' => $model->uuid, 'code' => $model->code, 'status' => $model->status],
            'schedule' => [
                'departure_at' => $model->schedule?->departure_at?->toIso8601String(),
                'arrival_at' => $model->schedule?->arrival_at?->toIso8601String(),
                'route' => $model->schedule?->route,
                'vehicle' => $model->schedule?->vehicle,
            ],
            'trip' => $trip ? ['uuid' => $trip->uuid, 'status' => $trip->status] : null,
            'location' => $location ? [
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'speed' => $location->speed,
                'heading' => $location->heading,
                'recorded_at' => $location->recordedAt,
            ] : null,
        ]]);
    }
}
