<?php

declare(strict_types=1);

namespace App\Modules\Drivers\Application\Services;

use App\Models\Booking;
use App\Models\Trip;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Transactional Live-Trip notifications, delivered into the existing
 * Notification Center inbox (`notifications` table, type `trip`). Recipients
 * are the customers with an active booking on the trip's schedule — or one
 * specific booking's customer for pickup/drop-off events.
 */
final class TripNotificationService
{
    private const ACTIVE = ['paid', 'ticket_generated', 'completed'];

    /** Notify every active customer on the trip's schedule (chunked insert). */
    public function notifyTrip(Trip $trip, string $title, string $body): int
    {
        $now = now();
        $created = 0;
        Booking::query()
            ->where('schedule_id', $trip->schedule_id)
            ->whereIn('status', self::ACTIVE)
            ->with('customer:id,user_id')
            ->select('id', 'schedule_id', 'customer_id')
            ->chunkById(500, function ($bookings) use ($trip, $title, $body, $now, &$created): void {
                $rows = $bookings
                    ->map(fn (Booking $b) => $b->customer?->user_id)
                    ->filter()
                    ->unique()
                    ->map(fn (int $userId) => [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $userId,
                        'type' => 'trip',
                        'title' => $title,
                        'body' => $body,
                        'metadata' => json_encode(['trip_id' => $trip->id, 'trip_uuid' => $trip->uuid]),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all();
                if ($rows !== []) {
                    DB::table('notifications')->insert($rows);
                    $created += count($rows);
                }
            });
        return $created;
    }

    /** Notify one booking's customer (pickup / drop-off events). */
    public function notifyBooking(Booking $booking, string $title, string $body): void
    {
        $userId = $booking->customer?->user_id ?? Booking::with('customer:id,user_id')->find($booking->id)?->customer?->user_id;
        if (! $userId) {
            return;
        }
        DB::table('notifications')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => 'trip',
            'title' => $title,
            'body' => $body,
            'metadata' => json_encode(['booking_id' => $booking->id, 'booking_code' => $booking->code]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
