<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation;

use App\Models\AuditTrail;
use App\Models\Driver;
use App\Models\JastipOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

/**
 * #10 Jastip (package delivery) management.
 * Admin/owner create & assign packages; drivers see the packages assigned to
 * them with pickup/drop points, kept separate from passenger trips.
 */
final class JastipController extends Controller
{
    // ------------------------------ Admin/Owner ------------------------------

    public function index(Request $request): JsonResponse
    {
        $q = JastipOrder::query()->with(['driver.user:id,name', 'route:id,code,origin,destination']);
        if ($routeId = $request->integer('route_id')) {
            $q->where('route_id', $routeId);
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->latest('id')->paginate(min(50, (int) $request->integer('per_page', 15)))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_name' => 'required|string|max:255',
            'description' => 'sometimes|nullable|string|max:2000',
            'sender_name' => 'sometimes|nullable|string|max:255',
            'receiver_name' => 'sometimes|nullable|string|max:255',
            // #3 every jastip belongs to a route; #7 every jastip has a driver.
            'route_id' => 'required|integer|exists:routes,id',
            'driver_id' => 'required|integer|exists:drivers,id',
            'pickup_label' => 'sometimes|nullable|string|max:255',
            'pickup_lat' => 'sometimes|nullable|numeric|between:-90,90',
            'pickup_lng' => 'sometimes|nullable|numeric|between:-180,180',
            'drop_label' => 'sometimes|nullable|string|max:255',
            'drop_lat' => 'sometimes|nullable|numeric|between:-90,90',
            'drop_lng' => 'sometimes|nullable|numeric|between:-180,180',
            'fee' => 'sometimes|numeric|min:0',
        ]);
        $order = JastipOrder::create($data + [
            'code' => 'JST-'.Str::upper(Str::random(8)),
            'status' => 'assigned',
            'fee' => $data['fee'] ?? 0,
        ]);
        AuditTrail::record('jastip.created', 'JastipOrder', 'user', (string) $request->user()?->id, ['id' => $order->id]);
        return response()->json(['data' => $order->load(['driver.user:id,name', 'route:id,code,origin,destination'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $order = JastipOrder::findOrFail($id);
        $data = $request->validate([
            'driver_id' => 'sometimes|integer|exists:drivers,id',
            'route_id' => 'sometimes|integer|exists:routes,id',
            'status' => 'sometimes|string|in:pending,assigned,picked_up,delivered,cancelled',
            'fee' => 'sometimes|numeric|min:0',
        ]);
        if (array_key_exists('driver_id', $data) && $data['driver_id'] && ($order->status === 'pending')) {
            $data['status'] = $data['status'] ?? 'assigned';
        }
        $order->update($data);
        AuditTrail::record('jastip.updated', 'JastipOrder', 'user', (string) $request->user()?->id, ['id' => $order->id]);
        return response()->json(['data' => $order->fresh(['driver.user:id,name', 'route:id,code,origin,destination'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $order = JastipOrder::findOrFail($id);
        $order->delete();
        AuditTrail::record('jastip.deleted', 'JastipOrder', 'user', (string) $request->user()?->id, ['id' => (int) $id]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    // -------------------------------- Driver --------------------------------

    /** Packages assigned to the authenticated driver (separate from trips). */
    public function forDriver(Request $request): JsonResponse
    {
        $driver = Driver::where('user_id', $request->user()?->id)->firstOrFail();
        $orders = JastipOrder::with('route:id,code,origin,destination')
            ->where('driver_id', $driver->id)
            ->whereIn('status', ['assigned', 'picked_up'])
            ->latest()
            ->get();
        return response()->json(['data' => $orders]);
    }

    public function driverUpdateStatus(Request $request, string $id): JsonResponse
    {
        $driver = Driver::where('user_id', $request->user()?->id)->firstOrFail();
        $order = JastipOrder::where('driver_id', $driver->id)->findOrFail($id);
        $data = $request->validate(['status' => 'required|string|in:picked_up,delivered']);

        // Forward-only: a delivered package cannot regress, and delivery
        // requires a prior pickup.
        abort_if($order->status === 'delivered', 422, 'Paket sudah diantar.');
        abort_if($data['status'] === 'delivered' && $order->picked_up_at === null && $order->status !== 'picked_up', 422, 'Paket belum diambil.');

        $before = $order->status;
        $order->update($data + ($data['status'] === 'picked_up' ? ['picked_up_at' => now()] : ['delivered_at' => now()]));

        \App\Models\ActivityLog::create([
            'action' => $data['status'] === 'picked_up' ? 'jastip.picked_up' : 'jastip.delivered',
            'subject_type' => 'JastipOrder',
            'subject_id' => $order->id,
            'metadata' => \App\Support\Audit\RequestContext::enrich($request, ['id' => $order->id, 'code' => $order->code, 'before' => ['status' => $before], 'after' => ['status' => $order->status]]),
        ]);

        return response()->json(['data' => $order->fresh()]);
    }
}
