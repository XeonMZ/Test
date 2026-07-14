<?php

declare(strict_types=1);

namespace App\Modules\Admin\Presentation;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Schedule;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AdminController extends Controller
{
    private function paginate(Request $request): int
    {
        return (int) min(100, max(5, $request->integer('per_page', 15)));
    }

    private function log(Request $request, string $action, string $subject, array $metadata = []): void
    {
        AuditTrail::record($action, $subject, 'user', (string) $request->user()?->id, $metadata);
        ActivityLog::create(['action' => $action, 'subject_type' => $subject, 'subject_id' => $metadata['id'] ?? null, 'metadata' => $metadata]);
    }

    // ----- Customers -----
    public function customers(Request $request): JsonResponse
    {
        $q = Customer::query()->with(['user:id,name,email,is_active,created_at', 'membership']);
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('phone', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->whereHas('user', fn ($u) => $u->where('is_active', $status === 'active'));
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function customerShow(string $id): JsonResponse
    {
        $customer = Customer::with(['user', 'membership', 'bookings' => fn ($q) => $q->latest()->limit(10)])->findOrFail($id);
        return response()->json(['data' => $customer]);
    }

    public function customerUpdate(Request $request, string $id): JsonResponse
    {
        $customer = Customer::with('user')->findOrFail($id);
        $data = $request->validate(['is_active' => 'sometimes|boolean', 'phone' => 'sometimes|string|max:32']);
        if (array_key_exists('is_active', $data) && $customer->user) {
            $customer->user->update(['is_active' => $data['is_active']]);
        }
        if (array_key_exists('phone', $data)) {
            $customer->update(['phone' => $data['phone']]);
        }
        $this->log($request, 'customer.updated', 'Customer', ['id' => $customer->id]);
        return response()->json(['data' => $customer->fresh(['user', 'membership'])]);
    }

    // ----- Drivers -----
    public function drivers(Request $request): JsonResponse
    {
        $q = Driver::query()->with(['user:id,name,email,is_active']);
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('license_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function driverShow(string $id): JsonResponse
    {
        $driver = Driver::with(['user', 'trips' => fn ($q) => $q->latest()->limit(10)])->findOrFail($id);
        return response()->json(['data' => $driver]);
    }

    public function driverUpdate(Request $request, string $id): JsonResponse
    {
        $driver = Driver::findOrFail($id);
        $data = $request->validate(['status' => 'sometimes|string|in:available,offline,suspended', 'license_number' => 'sometimes|string|max:64']);
        $driver->update($data);
        $this->log($request, 'driver.updated', 'Driver', ['id' => $driver->id]);
        return response()->json(['data' => $driver->fresh('user')]);
    }

    // ----- Vehicles -----
    public function vehicles(Request $request): JsonResponse
    {
        $q = Vehicle::query()->with('layout');
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('plate_number', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%")->orWhere('brand', 'like', "%{$search}%");
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function vehicleShow(string $id): JsonResponse
    {
        return response()->json(['data' => Vehicle::with(['layout', 'seats'])->findOrFail($id)]);
    }

    public function vehicleUpdate(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        $data = $request->validate(['status' => 'sometimes|string|in:active,maintenance,inactive,retired', 'brand' => 'sometimes|string|max:120']);
        $vehicle->update($data);
        $this->log($request, 'vehicle.updated', 'Vehicle', ['id' => $vehicle->id]);
        return response()->json(['data' => $vehicle->fresh('layout')]);
    }

    public function vehicleStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plate_number' => 'required|string|max:32|unique:vehicles,plate_number',
            'code' => 'required|string|max:32|unique:vehicles,code',
            'brand' => 'required|string|max:120',
            'status' => 'required|string|in:active,maintenance,inactive,retired',
            'vehicle_layout_id' => 'nullable|exists:vehicle_layouts,id',
        ]);
        $vehicle = Vehicle::create($data);
        $this->log($request, 'vehicle.created', 'Vehicle', ['id' => $vehicle->id]);
        return response()->json(['data' => $vehicle], 201);
    }

    // ----- Bookings -----
    public function bookings(Request $request): JsonResponse
    {
        $q = Booking::query()->with(['customer.user:id,name,email', 'schedule.route']);
        if ($search = $request->string('search')->toString()) {
            $q->where('code', 'like', "%{$search}%");
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function bookingShow(string $id): JsonResponse
    {
        return response()->json(['data' => Booking::with(['customer.user', 'schedule.route', 'passengers', 'ticket', 'payment', 'seatReservations'])->findOrFail($id)]);
    }

    public function bookingCancel(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);
        abort_if(in_array($booking->status, ['cancelled', 'completed'], true), 422, 'Booking sudah final dan tidak dapat dibatalkan.');
        $booking->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $this->log($request, 'booking.cancelled', 'Booking', ['id' => $booking->id]);
        return response()->json(['data' => $booking->fresh()]);
    }

    // ----- Payments (monitoring) -----
    public function payments(Request $request): JsonResponse
    {
        $q = Payment::query()->with(['booking.customer.user:id,name,email']);
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('reference', 'like', "%{$search}%")->orWhere('gateway_reference', 'like', "%{$search}%");
            });
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function paymentShow(string $id): JsonResponse
    {
        return response()->json(['data' => Payment::with(['booking.customer.user'])->findOrFail($id)]);
    }

    public function paymentMarkFailed(Request $request, string $id): JsonResponse
    {
        $payment = Payment::findOrFail($id);
        $payment->update(['status' => 'failed', 'failed_at' => now()]);
        $this->log($request, 'payment.marked_failed', 'Payment', ['id' => $payment->id]);
        return response()->json(['data' => $payment->fresh()]);
    }

    // ----- Tickets (monitoring) -----
    public function tickets(Request $request): JsonResponse
    {
        $q = Ticket::query()->with(['booking.customer.user:id,name', 'trip']);
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($search = $request->string('search')->toString()) {
            $q->where('ticket_number', 'like', "%{$search}%");
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    // ----- Trip & route scheduling -----
    public function operations(Request $request): JsonResponse
    {
        $q = Schedule::query()->with(['route', 'driver.user:id,name', 'vehicle']);
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->orderBy('departure_at', 'desc')->paginate($this->paginate($request))]);
    }

    // ----- Notification center -----
    public function notifications(Request $request): JsonResponse
    {
        $q = Notification::query()->with('user:id,name,email,role');
        if ($type = $request->string('type')->toString()) {
            $q->where('type', $type);
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function notificationBroadcast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:2000',
            'role' => 'required|string|in:customer,driver,admin,owner,all',
            'type' => 'nullable|string|max:50',
        ]);
        $users = User::query()->when($data['role'] !== 'all', fn ($q) => $q->where('role', $data['role']))->pluck('id');
        $rows = $users->map(fn ($userId) => [
            'uuid' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $data['type'] ?? 'broadcast',
            'title' => $data['title'],
            'body' => $data['body'],
            'metadata' => json_encode(['broadcast_by' => $request->user()?->id]),
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();
        if ($rows !== []) {
            DB::table('notifications')->insert($rows);
        }
        $this->log($request, 'notification.broadcast', 'Notification', ['count' => count($rows), 'role' => $data['role']]);
        return response()->json(['data' => ['sent' => count($rows)]], 201);
    }

    // ----- Reports & activity logs -----
    public function reports(Request $request): JsonResponse
    {
        $from = $request->date('from') ?? now()->subDays(30);
        $to = $request->date('to') ?? now();
        return response()->json(['data' => [
            'bookings_total' => Booking::whereBetween('created_at', [$from, $to])->count(),
            'bookings_by_status' => Booking::whereBetween('created_at', [$from, $to])->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'revenue_total' => (float) Payment::where('status', 'paid')->whereBetween('paid_at', [$from, $to])->sum('amount'),
            'payments_by_status' => Payment::whereBetween('created_at', [$from, $to])->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'active_customers' => Customer::whereHas('user', fn ($q) => $q->where('is_active', true))->count(),
            'active_drivers' => Driver::where('status', '!=', 'suspended')->count(),
            'active_vehicles' => Vehicle::where('status', 'active')->count(),
            'tickets_checked_in' => Ticket::whereNotNull('checked_in_at')->whereBetween('checked_in_at', [$from, $to])->count(),
        ]]);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        return response()->json(['data' => ActivityLog::query()->latest('id')->paginate($this->paginate($request))]);
    }

    // ----- System settings -----
    public function settings(): JsonResponse
    {
        return response()->json(['data' => \App\Models\SystemSetting::query()->orderBy('key')->get()]);
    }

    public function settingsUpdate(Request $request): JsonResponse
    {
        $data = $request->validate(['key' => 'required|string|max:150', 'value' => 'required', 'is_public' => 'sometimes|boolean']);
        $setting = \App\Models\SystemSetting::updateOrCreate(['key' => $data['key']], ['value' => $data['value'], 'is_public' => $data['is_public'] ?? false]);
        if ($setting->key === \App\Support\Settings\SettingKey::MaintenanceMode->value) {
            cache()->forget('settings.maintenance_mode');
        }
        $this->log($request, 'setting.updated', 'SystemSetting', ['key' => $setting->key]);
        return response()->json(['data' => $setting]);
    }
}
