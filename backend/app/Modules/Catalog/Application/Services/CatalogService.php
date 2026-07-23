<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Application\Services;

use App\Models\Route;
use App\Models\Schedule;
use App\Models\SeatReservation;
use App\Models\VehicleSeat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Read-only public catalog used by the booking funnel.
 * Exposes routes, searchable schedules, and live seat availability
 * without leaking internal identifiers beyond what booking needs.
 */
final class CatalogService
{
    /** Active booking statuses that make a seat unavailable. */
    private const BLOCKING_BOOKING_STATUSES = ['seat_locked', 'waiting_payment', 'paid', 'ticket_generated'];

    public function routes(): Collection
    {
        return Route::query()
            ->with(['pickupPoints:id,route_id,name,address', 'dropPoints:id,route_id,name,address'])
            ->orderBy('origin')
            ->orderBy('destination')
            ->get()
            ->map(fn (Route $route): array => [
                'id' => $route->id,
                'uuid' => $route->uuid,
                'code' => $route->code,
                'origin' => $route->origin,
                'destination' => $route->destination,
                'distance_km' => (int) $route->distance_km,
                'duration_minutes' => (int) $route->duration_minutes,
                'pickup_points' => $route->pickupPoints->map(fn ($p) => ['name' => $p->name, 'address' => $p->address])->values(),
                'drop_points' => $route->dropPoints->map(fn ($p) => ['name' => $p->name, 'address' => $p->address])->values(),
            ]);
    }

    /**
     * @param array{origin?: string|null, destination?: string|null, date?: string|null, route_id?: int|null} $filters
     */
    public function schedules(array $filters): Collection
    {
        $now = now();

        $query = Schedule::query()
            ->with(['route:id,uuid,code,origin,destination,duration_minutes', 'vehicle:id,uuid,code,brand,plate_number,vehicle_layout_id,status', 'vehicle.layout:id,name,capacity'])
            ->where('status', 'scheduled')
            ->where('departure_at', '>', $now)
            ->whereHas('vehicle', fn ($q) => $q->where('status', 'active'));

        if (! empty($filters['route_id'])) {
            $query->where('route_id', (int) $filters['route_id']);
        }

        if (! empty($filters['origin'])) {
            $query->whereHas('route', fn ($q) => $q->where('origin', 'like', '%'.$filters['origin'].'%'));
        }

        if (! empty($filters['destination'])) {
            $query->whereHas('route', fn ($q) => $q->where('destination', 'like', '%'.$filters['destination'].'%'));
        }

        if (! empty($filters['date'])) {
            $date = Carbon::parse($filters['date']);
            $query->whereBetween('departure_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()]);
        }

        $schedules = $query->orderBy('departure_at')->limit(50)->get();

        $reservedCounts = $this->reservedCounts($schedules->pluck('id')->all(), $now);

        return $schedules->map(function (Schedule $schedule) use ($reservedCounts): array {
            $capacity = (int) ($schedule->vehicle?->layout?->capacity ?? VehicleSeat::where('vehicle_id', $schedule->vehicle_id)->where('is_active', true)->count());
            $reserved = (int) ($reservedCounts[$schedule->id] ?? 0);

            return [
                'id' => $schedule->id,
                'uuid' => $schedule->uuid,
                'departure_at' => $schedule->departure_at?->toIso8601String(),
                'arrival_at' => $schedule->arrival_at?->toIso8601String(),
                'base_fare' => (float) $schedule->base_fare,
                'status' => $schedule->status,
                'route' => $schedule->route ? [
                    'id' => $schedule->route->id,
                    'code' => $schedule->route->code,
                    'origin' => $schedule->route->origin,
                    'destination' => $schedule->route->destination,
                    'duration_minutes' => (int) $schedule->route->duration_minutes,
                ] : null,
                'vehicle' => $schedule->vehicle ? [
                    'code' => $schedule->vehicle->code,
                    'brand' => $schedule->vehicle->brand,
                    'layout' => $schedule->vehicle->layout?->name,
                ] : null,
                'capacity' => $capacity,
                'seats_available' => max(0, $capacity - $reserved),
            ];
        });
    }

    /** @return array<string, mixed> */
    public function seats(string $scheduleUuid): array
    {
        $now = now();
        $schedule = Schedule::query()
            ->with(['route:id,code,origin,destination', 'vehicle:id,code,brand,vehicle_layout_id', 'vehicle.layout:id,name,capacity'])
            ->where('uuid', $scheduleUuid)
            ->firstOrFail();

        $blockedSeatIds = SeatReservation::query()
            ->whereHas('booking', fn ($q) => $q->where('schedule_id', $schedule->id)->whereIn('status', self::BLOCKING_BOOKING_STATUSES))
            ->where(function ($query) use ($now): void {
                $query->whereIn('status', ['confirmed', 'paid', 'ticket_generated'])
                    ->orWhere(fn ($q) => $q->whereIn('status', ['locked', 'waiting_payment'])->where('locked_until', '>', $now));
            })
            ->pluck('vehicle_seat_id')
            ->all();

        // Every cell of the drawn layout — seats AND furniture (driver, door,
        // aisle, toilet …). The customer seat map needs the whole grid to
        // reproduce the layout the operator drew, not just the bookable seats.
        $cells = VehicleSeat::query()
            ->where('vehicle_id', $schedule->vehicle_id)
            ->orderBy('row_index')
            ->orderBy('column_index')
            ->orderBy('id')
            ->get(['id', 'seat_number', 'class', 'is_active', 'row_index', 'column_index', 'cell_type', 'label']);

        // Rows created before the layout builder existed all default to (0,0).
        // Coordinates are only trustworthy when every cell occupies its own
        // square; otherwise the client falls back to an auto-generated grid.
        $coordinates = $cells->map(fn (VehicleSeat $cell): string => ((int) $cell->row_index).':'.((int) $cell->column_index));
        $hasLayout = $cells->count() > 1 && $coordinates->unique()->count() === $cells->count();

        $isSeat = fn (VehicleSeat $cell): bool => ($cell->cell_type ?? 'seat') === 'seat' && (bool) $cell->is_active;

        $seats = $cells
            ->filter($isSeat)
            ->values()
            ->map(fn (VehicleSeat $seat): array => [
                'id' => $seat->id,
                'seat_number' => $seat->seat_number,
                'class' => $seat->class,
                'available' => ! in_array($seat->id, $blockedSeatIds, true),
                'row_index' => (int) $seat->row_index,
                'column_index' => (int) $seat->column_index,
                'cell_type' => $seat->cell_type ?? 'seat',
            ]);

        $layout = [
            'has_layout' => $hasLayout,
            'rows' => $hasLayout ? ((int) $cells->max('row_index') + 1) : 0,
            'columns' => $hasLayout ? ((int) $cells->max('column_index') + 1) : 0,
            'cells' => $hasLayout
                ? $cells->map(fn (VehicleSeat $cell): array => [
                    // Only real seats carry a bookable id; furniture is display-only.
                    'seat_id' => $isSeat($cell) ? $cell->id : null,
                    'seat_number' => $isSeat($cell) ? $cell->seat_number : null,
                    'row_index' => (int) $cell->row_index,
                    'column_index' => (int) $cell->column_index,
                    'cell_type' => $cell->cell_type ?? 'seat',
                    'label' => $cell->label,
                    'available' => $isSeat($cell) ? ! in_array($cell->id, $blockedSeatIds, true) : false,
                ])->values()
                : [],
        ];

        return [
            'schedule' => [
                'id' => $schedule->id,
                'uuid' => $schedule->uuid,
                'departure_at' => $schedule->departure_at?->toIso8601String(),
                'arrival_at' => $schedule->arrival_at?->toIso8601String(),
                'base_fare' => (float) $schedule->base_fare,
                'route' => $schedule->route ? ['code' => $schedule->route->code, 'origin' => $schedule->route->origin, 'destination' => $schedule->route->destination] : null,
                'vehicle' => $schedule->vehicle ? ['code' => $schedule->vehicle->code, 'brand' => $schedule->vehicle->brand, 'layout' => $schedule->vehicle->layout?->name] : null,
            ],
            'seats' => $seats,
            'layout' => $layout,
            'seats_available' => $seats->where('available', true)->count(),
            'capacity' => $seats->count(),
        ];
    }

    /** @param array<int, int> $scheduleIds @return array<int, int> */
    private function reservedCounts(array $scheduleIds, Carbon $now): array
    {
        if ($scheduleIds === []) {
            return [];
        }

        return SeatReservation::query()
            ->join('bookings', 'bookings.id', '=', 'seat_reservations.booking_id')
            ->whereIn('bookings.schedule_id', $scheduleIds)
            ->whereIn('bookings.status', self::BLOCKING_BOOKING_STATUSES)
            ->where(function ($query) use ($now): void {
                $query->whereIn('seat_reservations.status', ['confirmed', 'paid', 'ticket_generated'])
                    ->orWhere(fn ($q) => $q->whereIn('seat_reservations.status', ['locked', 'waiting_payment'])->where('seat_reservations.locked_until', '>', $now));
            })
            ->selectRaw('bookings.schedule_id, count(*) as total')
            ->groupBy('bookings.schedule_id')
            ->pluck('total', 'schedule_id')
            ->all();
    }
}
