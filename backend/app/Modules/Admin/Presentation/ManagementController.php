<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\PricingRule;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\VehicleSeat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Operational management for admin/owner: routes, schedules, pricing rules,
 * and per-vehicle seats. This is what makes the catalog (and therefore the
 * whole booking funnel) fillable from the UI rather than seed-only.
 */
final class ManagementController extends Controller
{
    private function log(Request $request, string $action, string $subject, array $metadata = []): void
    {
        AuditTrail::record($action, $subject, 'user', (string) $request->user()?->id, $metadata);
        ActivityLog::create(['action' => $action, 'subject_type' => $subject, 'subject_id' => $metadata['id'] ?? null, 'metadata' => $metadata]);
    }

    // ------------------------------- Routes -------------------------------

    public function routes(Request $request): JsonResponse
    {
        $q = Route::query()->withCount('schedules');
        if ($search = $request->string('search')->toString()) {
            $q->where(fn ($query) => $query->where('code', 'like', "%{$search}%")->orWhere('origin', 'like', "%{$search}%")->orWhere('destination', 'like', "%{$search}%"));
        }
        return response()->json(['data' => $q->latest('id')->paginate(min(50, (int) $request->integer('per_page', 15)))]);
    }

    public function routeStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:routes,code',
            'origin' => 'required|string|max:120',
            'destination' => 'required|string|max:120|different:origin',
            'distance_km' => 'required|integer|min:1|max:100000',
            'duration_minutes' => 'required|integer|min:1|max:100000',
        ]);
        $route = Route::create($data);
        $this->log($request, 'route.created', 'Route', ['id' => $route->id]);
        return response()->json(['data' => $route], 201);
    }

    public function routeUpdate(Request $request, string $id): JsonResponse
    {
        $route = Route::findOrFail($id);
        $data = $request->validate([
            'code' => 'sometimes|string|max:32|unique:routes,code,'.$route->id,
            'origin' => 'sometimes|string|max:120',
            'destination' => 'sometimes|string|max:120',
            'distance_km' => 'sometimes|integer|min:1|max:100000',
            'duration_minutes' => 'sometimes|integer|min:1|max:100000',
        ]);
        $route->update($data);
        $this->log($request, 'route.updated', 'Route', ['id' => $route->id]);
        return response()->json(['data' => $route->fresh()]);
    }

    // ------------------------------ Schedules ------------------------------

    public function schedules(Request $request): JsonResponse
    {
        $q = Schedule::query()->with(['route:id,code,origin,destination', 'vehicle:id,code,brand', 'driver.user:id,name'])->withCount('bookings');
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($routeId = $request->integer('route_id')) {
            $q->where('route_id', $routeId);
        }
        return response()->json(['data' => $q->orderByDesc('departure_at')->paginate(min(50, (int) $request->integer('per_page', 15)))]);
    }

    public function scheduleStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_id' => 'required|exists:routes,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'departure_at' => 'required|date|after:now',
            'arrival_at' => 'required|date|after:departure_at',
            'base_fare' => 'required|numeric|min:0|max:100000000',
            'status' => 'sometimes|string|in:scheduled,cancelled,departed,completed',
        ]);

        // Prevent double-booking a vehicle/driver across overlapping windows.
        $overlaps = Schedule::query()
            ->whereIn('status', ['scheduled', 'departed'])
            ->where(fn ($q) => $q->where('vehicle_id', $data['vehicle_id'])->orWhere('driver_id', $data['driver_id']))
            ->where('departure_at', '<', $data['arrival_at'])
            ->where('arrival_at', '>', $data['departure_at'])
            ->exists();
        abort_if($overlaps, 422, 'Kendaraan atau driver sudah memiliki jadwal yang bertabrakan pada rentang waktu tersebut.');

        $schedule = DB::transaction(function () use ($data): Schedule {
            $schedule = Schedule::create([
                'route_id' => $data['route_id'],
                'vehicle_id' => $data['vehicle_id'],
                'driver_id' => $data['driver_id'],
                'departure_at' => $data['departure_at'],
                'arrival_at' => $data['arrival_at'],
                'base_fare' => $data['base_fare'],
                'status' => $data['status'] ?? 'scheduled',
            ]);

            // Every schedule gets a trip so drivers/passenger manifests work immediately.
            Trip::create([
                'schedule_id' => $schedule->id,
                'route_id' => $schedule->route_id,
                'driver_id' => $schedule->driver_id,
                'vehicle_id' => $schedule->vehicle_id,
                'status' => 'ready',
            ]);

            return $schedule;
        });

        $this->log($request, 'schedule.created', 'Schedule', ['id' => $schedule->id]);
        return response()->json(['data' => $schedule->load(['route', 'vehicle', 'driver.user'])], 201);
    }

    public function scheduleUpdate(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);
        $data = $request->validate([
            'departure_at' => 'sometimes|date',
            'arrival_at' => 'sometimes|date',
            'base_fare' => 'sometimes|numeric|min:0|max:100000000',
            'status' => 'sometimes|string|in:scheduled,cancelled,departed,completed',
            'driver_id' => 'sometimes|exists:drivers,id',
        ]);

        // Changing fare after seats are sold would desync paid amounts.
        if (array_key_exists('base_fare', $data) && $schedule->bookings()->whereNotIn('status', ['cancelled', 'expired'])->exists()) {
            abort(422, 'Tarif tidak dapat diubah karena sudah ada pemesanan aktif pada jadwal ini.');
        }

        $schedule->update($data);
        $this->log($request, 'schedule.updated', 'Schedule', ['id' => $schedule->id]);
        return response()->json(['data' => $schedule->fresh(['route', 'vehicle', 'driver.user'])]);
    }

    public function scheduleCancel(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);
        abort_if($schedule->status === 'completed', 422, 'Jadwal yang sudah selesai tidak dapat dibatalkan.');

        DB::transaction(function () use ($schedule): void {
            $schedule->update(['status' => 'cancelled']);
            Trip::where('schedule_id', $schedule->id)->whereNotIn('status', ['completed'])->update(['status' => 'cancelled']);
        });

        $this->log($request, 'schedule.cancelled', 'Schedule', ['id' => $schedule->id]);
        return response()->json(['data' => $schedule->fresh()]);
    }

    // ---------------------------- Pricing rules ----------------------------

    public function pricingRules(Request $request): JsonResponse
    {
        $q = PricingRule::query()->with('route:id,code,origin,destination');
        if ($routeId = $request->integer('route_id')) {
            $q->where('route_id', $routeId);
        }
        return response()->json(['data' => $q->latest('id')->paginate(min(50, (int) $request->integer('per_page', 15)))]);
    }

    public function pricingStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'route_id' => 'required|exists:routes,id',
            'name' => 'required|string|max:120',
            'amount' => 'required|numeric|min:0|max:100000000',
            'metadata' => 'sometimes|array',
        ]);
        $rule = PricingRule::create($data);
        $this->log($request, 'pricing.created', 'PricingRule', ['id' => $rule->id]);
        return response()->json(['data' => $rule->load('route')], 201);
    }

    public function pricingUpdate(Request $request, string $id): JsonResponse
    {
        $rule = PricingRule::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:120',
            'amount' => 'sometimes|numeric|min:0|max:100000000',
            'metadata' => 'sometimes|array',
        ]);
        $rule->update($data);
        $this->log($request, 'pricing.updated', 'PricingRule', ['id' => $rule->id]);
        return response()->json(['data' => $rule->fresh('route')]);
    }

    public function pricingDestroy(Request $request, string $id): JsonResponse
    {
        $rule = PricingRule::findOrFail($id);
        $rule->delete();
        $this->log($request, 'pricing.deleted', 'PricingRule', ['id' => (int) $id]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    // ---------------------------- Vehicle seats ----------------------------

/** Full seat map (grid cells) for the builder UI. */
    public function vehicleSeatsMap(string $vehicle): JsonResponse
    {
        $model = Vehicle::findOrFail($vehicle);
        return response()->json(['data' => VehicleSeat::where('vehicle_id', $model->id)
            ->orderBy('row_index')->orderBy('column_index')
            ->get(['id', 'seat_number', 'row_index', 'column_index', 'cell_type', 'label', 'class', 'is_active'])]);
    }

    /**
     * #1 Save a full-custom seat layout. The client sends the whole grid of
     * cells (seats/aisle/driver/door/empty). We replace the vehicle's seats
     * transactionally so the map always matches exactly what the operator drew.
     */
    public function vehicleSeatsLayout(Request $request, string $vehicle): JsonResponse
    {
        $model = Vehicle::findOrFail($vehicle);
        $data = $request->validate([
            'cells' => 'required|array|min:1',
            'cells.*.row_index' => 'required|integer|min:0|max:60',
            'cells.*.column_index' => 'required|integer|min:0|max:20',
            'cells.*.cell_type' => 'required|string|in:seat,aisle,driver,door,empty',
            'cells.*.seat_number' => 'nullable|string|max:16',
            'cells.*.label' => 'nullable|string|max:32',
            'cells.*.class' => 'sometimes|string|in:regular,vip,executive',
        ]);

        // Seat numbers must be unique among actual seats.
        $seatNumbers = collect($data['cells'])->where('cell_type', 'seat')->pluck('seat_number')->filter();
        abort_if($seatNumbers->count() !== $seatNumbers->unique()->count(), 422, 'Nomor kursi tidak boleh duplikat.');
        abort_if($seatNumbers->contains(fn ($n) => blank($n)), 422, 'Setiap kursi wajib punya nomor.');

        // Grid coordinates must be unique — two cells cannot occupy one square.
        $coordinates = collect($data['cells'])->map(fn ($cell) => $cell['row_index'].':'.$cell['column_index']);
        abort_if($coordinates->count() !== $coordinates->unique()->count(), 422, 'Terdapat dua sel pada koordinat yang sama.');

        // Don't destroy a layout that already has active bookings tied to seats.
        $hasReservations = DB::table('seat_reservations')
            ->join('vehicle_seats', 'seat_reservations.vehicle_seat_id', '=', 'vehicle_seats.id')
            ->where('vehicle_seats.vehicle_id', $model->id)
            ->whereNull('seat_reservations.deleted_at')
            ->whereIn('seat_reservations.status', ['held', 'locked', 'confirmed', 'reserved'])
            ->exists();
        abort_if($hasReservations, 422, 'Tidak dapat mengubah denah: masih ada kursi yang direservasi.');

        DB::transaction(function () use ($model, $data): void {
            // forceDelete, not delete: VehicleSeat is soft-deleting, and the
            // (vehicle_id, seat_number) UNIQUE index still holds soft-deleted
            // rows — a plain delete() made every layout re-save collide with
            // its own previous version (SQLSTATE 23000 duplicate entry).
            // Replacement is destructive by design; the reservation guard
            // above already refuses when any seat is booked.
            VehicleSeat::where('vehicle_id', $model->id)->forceDelete();
            foreach ($data['cells'] as $cell) {
                VehicleSeat::create([
                    'vehicle_id' => $model->id,
                    // Placeholder cells (door/aisle/driver/empty) get a
                    // coordinate-derived, guaranteed-unique seat_number; the
                    // human label is display-only. Using the label here caused
                    // two doors both labelled "door" to violate the unique key.
                    'seat_number' => $cell['cell_type'] === 'seat'
                        ? $cell['seat_number']
                        : $cell['cell_type'].'-'.$cell['row_index'].'-'.$cell['column_index'],
                    'row_index' => $cell['row_index'],
                    'column_index' => $cell['column_index'],
                    'cell_type' => $cell['cell_type'],
                    'label' => $cell['label'] ?? null,
                    'class' => $cell['class'] ?? 'regular',
                    'is_active' => $cell['cell_type'] === 'seat',
                ]);
            }
        });

        $this->log($request, 'vehicle.layout.saved', 'Vehicle', ['id' => $model->id, 'cells' => count($data['cells'])]);
        return response()->json(['data' => VehicleSeat::where('vehicle_id', $model->id)->orderBy('row_index')->orderBy('column_index')->get(['id', 'seat_number', 'row_index', 'column_index', 'cell_type', 'label', 'class', 'is_active'])]);
    }

    // ------------------------- Support lists (for forms) -------------------

    public function formOptions(): JsonResponse
    {
        return response()->json(['data' => [
            'routes' => Route::orderBy('origin')->get(['id', 'code', 'origin', 'destination']),
            'vehicles' => Vehicle::where('status', 'active')->get(['id', 'code', 'brand']),
            // Any non-suspended driver can be scheduled (offline today may still
            // drive tomorrow). 'active' was a stale vocabulary that matched nothing.
            'drivers' => \App\Models\Driver::where('status', '!=', 'suspended')->with('user:id,name')->get(['id', 'user_id'])->map(fn ($d) => ['id' => $d->id, 'name' => $d->user?->name ?? 'Driver #'.$d->id]),
        ]]);
    }
}
