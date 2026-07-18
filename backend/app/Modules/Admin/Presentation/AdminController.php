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
use App\Models\NotificationActivity;
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
        $metadata = \App\Support\Audit\RequestContext::enrich($request, $metadata);
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
        $before = $driver->only(array_keys($data));
        $driver->update($data);
        $this->log($request, 'driver.updated', 'Driver', ['id' => $driver->id, 'before' => $before, 'after' => $driver->only(array_keys($data))]);
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

        $page = $q->latest('id')->paginate($this->paginate($request));
        $onTrip = \App\Models\Trip::query()
            ->whereIn('status', ['started', 'pickup', 'boarding', 'on_route', 'drop_off'])
            ->whereIn('vehicle_id', $page->getCollection()->pluck('id'))
            ->pluck('vehicle_id')
            ->flip();
        $page->getCollection()->transform(function (Vehicle $vehicle) use ($onTrip) {
            $vehicle->setAttribute('on_trip', $onTrip->has($vehicle->id));
            return $vehicle;
        });

        return response()->json(['data' => $page]);
    }

    public function vehicleShow(string $id): JsonResponse
    {
        return response()->json(['data' => Vehicle::with(['layout', 'seats'])->findOrFail($id)]);
    }

    public function vehicleUpdate(Request $request, string $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        $data = $request->validate(['status' => 'sometimes|string|in:active,maintenance,inactive,retired', 'brand' => 'sometimes|string|max:120']);
        $before = $vehicle->only(array_keys($data));
        $vehicle->update($data);
        $this->log($request, 'vehicle.updated', 'Vehicle', ['id' => $vehicle->id, 'before' => $before, 'after' => $vehicle->only(array_keys($data))]);
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

    /** Booking statuses that occupy a seat / count as an active reservation. */
    private const ACTIVE_BOOKING_STATUSES = ['seat_locked', 'waiting_payment', 'paid', 'ticket_generated', 'completed'];

    /**
     * Schedule-first overview for Booking Management: one row per departure
     * with booking count, seats taken/capacity, and live trip status. All
     * aggregates are correlated subqueries resolved in a single SQL statement,
     * so the page stays fast at 10⁵+ bookings — the heavy per-booking data is
     * only fetched when a card is expanded (see bookings() with schedule_id).
     */
    public function bookingSchedules(Request $request): JsonResponse
    {
        $q = $this->scheduleOverviewQuery($request)
            ->withCount(['bookings as bookings_count' => fn ($b) => $b->where('status', '!=', 'draft')])
            ->addSelect(['seats_taken' => DB::table('seat_reservations')
                ->join('bookings as sb', 'sb.id', '=', 'seat_reservations.booking_id')
                ->whereColumn('sb.schedule_id', 'schedules.id')
                ->whereIn('sb.status', self::ACTIVE_BOOKING_STATUSES)
                ->whereNull('seat_reservations.deleted_at')
                ->whereNull('sb.deleted_at')
                ->selectRaw('count(*)')]);

        // Status filter narrows to departures that actually contain such bookings.
        if ($status = $request->string('status')->toString()) {
            $q->whereHas('bookings', fn ($b) => $b->where('status', $status));
        }
        if ($search = $request->string('search')->toString()) {
            $this->applyScheduleSearch($q, $search, includePayments: false);
        }

        return response()->json(['data' => $q->paginate($this->paginate($request))]);
    }

    /** Shared base: schedule + route/driver/vehicle + capacity + latest trip status. */
    private function scheduleOverviewQuery(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $q = Schedule::query()
            ->with(['route:id,code,origin,destination', 'driver.user:id,name', 'vehicle:id,code,brand,plate_number'])
            ->addSelect(['capacity' => DB::table('vehicle_seats')
                ->whereColumn('vehicle_seats.vehicle_id', 'schedules.vehicle_id')
                ->where('cell_type', 'seat')
                ->whereNull('deleted_at')
                ->selectRaw('count(*)')])
            ->addSelect(['trip_status' => DB::table('trips')
                ->select('status')
                ->whereColumn('trips.schedule_id', 'schedules.id')
                ->orderByDesc('id')
                ->limit(1)]);

        if ($date = $request->string('date')->toString()) {
            $q->whereDate('departure_at', $date);
        }
        if ($from = $request->date('from')) {
            $q->where('departure_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $q->where('departure_at', '<=', \Illuminate\Support\Carbon::parse($to)->endOfDay());
        }
        if ($scheduleStatus = $request->string('schedule_status')->toString()) {
            $q->where('status', $scheduleStatus);
        }

        return $q->select('schedules.*')->orderByDesc('departure_at');
    }

    /**
     * Search across the whole tree: route, driver name, booking code,
     * customer name/phone — and, for the payment view, payment method too.
     * A schedule matches when any of its own fields or any of its bookings
     * match, so operators can find a departure by anything they know.
     */
    private function applyScheduleSearch(\Illuminate\Database\Eloquent\Builder $q, string $search, bool $includePayments): void
    {
        $q->where(function ($outer) use ($search, $includePayments): void {
            $outer
                ->whereHas('route', fn ($r) => $r->where('origin', 'like', "%{$search}%")->orWhere('destination', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
                ->orWhereHas('driver.user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                ->orWhereHas('vehicle', fn ($v) => $v->where('code', 'like', "%{$search}%")->orWhere('brand', 'like', "%{$search}%")->orWhere('plate_number', 'like', "%{$search}%"))
                ->orWhereHas('bookings', function ($b) use ($search, $includePayments): void {
                    $b->where(function ($bb) use ($search, $includePayments): void {
                        $bb->where('code', 'like', "%{$search}%")
                            ->orWhereHas('customer', fn ($c) => $c->where('phone', 'like', "%{$search}%"))
                            ->orWhereHas('customer.user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
                        if ($includePayments) {
                            $bb->orWhereHas('payment', fn ($p) => $p->where('method', 'like', "%{$search}%")->orWhere('provider', 'like', "%{$search}%")->orWhere('reference', 'like', "%{$search}%"));
                        }
                    });
                });
        });
    }

    public function bookings(Request $request): JsonResponse
    {
        $q = Booking::query()->with([
            'customer:id,user_id,phone',
            'customer.user:id,name,email',
            'schedule.route:id,code,origin,destination',
            'payment:id,booking_id,status,amount,method,paid_at',
            'seatReservations.vehicleSeat:id,seat_number',
            'passengers:id,booking_id,name,identity_number',
        ]);

        // Accordion detail: only bookings of the expanded departure are loaded.
        if ($scheduleId = $request->integer('schedule_id')) {
            $q->where('schedule_id', $scheduleId);
        }
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('phone', 'like', "%{$search}%"))
                    ->orWhereHas('customer.user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function bookingShow(string $id): JsonResponse
    {
        return response()->json(['data' => Booking::with(['customer.user', 'schedule.route', 'passengers', 'ticket', 'payment', 'seatReservations.vehicleSeat:id,seat_number'])->findOrFail($id)]);
    }

    /**
     * Edit booking passenger names (typo fixes at the counter). Seat, amount,
     * and status stay under the booking/payment state machines — editing them
     * here would desync payments, so they are deliberately not editable.
     */
    public function bookingUpdate(Request $request, string $id): JsonResponse
    {
        $booking = Booking::with('passengers')->findOrFail($id);
        abort_if(in_array($booking->status, ['cancelled', 'expired'], true), 422, 'Booking yang sudah batal/kedaluwarsa tidak dapat diubah.');

        $data = $request->validate([
            'passengers' => 'required|array|min:1',
            'passengers.*.id' => 'required|integer',
            'passengers.*.name' => 'required|string|max:255',
        ]);

        $own = $booking->passengers->keyBy('id');
        $before = [];
        $after = [];
        foreach ($data['passengers'] as $row) {
            $passenger = $own->get($row['id']);
            abort_unless($passenger !== null, 422, 'Penumpang tidak ditemukan pada booking ini.');
            if ($passenger->name !== $row['name']) {
                $before[$passenger->id] = $passenger->name;
                $after[$passenger->id] = $row['name'];
                $passenger->update(['name' => $row['name']]);
            }
        }

        if ($after !== []) {
            $this->log($request, 'booking.passengers_updated', 'Booking', ['id' => $booking->id, 'before' => $before, 'after' => $after]);
        }
        return response()->json(['data' => $booking->fresh(['passengers'])]);
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

    /**
     * Schedule-first overview for Payment Management: one row per departure
     * with booking count, paid/pending counts, and total collected revenue.
     * Same single-statement aggregate strategy as bookingSchedules().
     */
    public function paymentSchedules(Request $request): JsonResponse
    {
        $paymentAgg = fn (string $select, ?string $status = null) => DB::table('payments')
            ->join('bookings as pb', 'pb.id', '=', 'payments.booking_id')
            ->whereColumn('pb.schedule_id', 'schedules.id')
            ->whereNull('payments.deleted_at')
            ->whereNull('pb.deleted_at')
            ->when($status !== null, fn ($x) => $x->where('payments.status', $status))
            ->selectRaw($select);

        $q = $this->scheduleOverviewQuery($request)
            ->withCount(['bookings as bookings_count' => fn ($b) => $b->where('status', '!=', 'draft')])
            ->addSelect([
                'paid_count' => $paymentAgg('count(*)', 'paid'),
                'pending_count' => $paymentAgg('count(*)', 'pending'),
                'total_paid' => $paymentAgg("coalesce(sum(payments.amount), 0)", 'paid'),
            ]);

        if ($status = $request->string('status')->toString()) {
            $q->whereHas('bookings.payment', fn ($p) => $p->where('status', $status));
        }
        if ($search = $request->string('search')->toString()) {
            $this->applyScheduleSearch($q, $search, includePayments: true);
        }

        return response()->json(['data' => $q->paginate($this->paginate($request))]);
    }

    public function payments(Request $request): JsonResponse
    {
        $q = Payment::query()->with(['booking.customer:id,user_id,phone', 'booking.customer.user:id,name,email']);

        // Accordion detail: only payments of the expanded departure are loaded.
        if ($scheduleId = $request->integer('schedule_id')) {
            $q->whereHas('booking', fn ($b) => $b->where('schedule_id', $scheduleId));
        }
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($method = $request->string('method')->toString()) {
            $q->where('method', $method);
        }
        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('reference', 'like', "%{$search}%")
                    ->orWhere('gateway_reference', 'like', "%{$search}%")
                    ->orWhere('method', 'like', "%{$search}%")
                    ->orWhereHas('booking', fn ($b) => $b->where('code', 'like', "%{$search}%"))
                    ->orWhereHas('booking.customer', fn ($c) => $c->where('phone', 'like', "%{$search}%"))
                    ->orWhereHas('booking.customer.user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }
        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    public function paymentShow(string $id): JsonResponse
    {
        return response()->json(['data' => Payment::with(['booking.customer.user', 'booking.schedule.route'])->findOrFail($id)]);
    }

    /**
     * Manual verification: transitions a pending payment to paid through the
     * exact same pipeline the gateway webhook uses (state machine, booking
     * confirmation, ticket generation, notifications) — no parallel flow.
     */
    public function paymentVerify(
        Request $request,
        string $id,
        \App\Modules\Payments\Application\Services\PaymentWebhookService $webhooks,
        \App\Modules\Payments\Domain\Repositories\PaymentRepository $payments,
    ): JsonResponse {
        $payment = Payment::findOrFail($id);
        abort_unless($payment->status === 'pending', 422, 'Hanya pembayaran berstatus pending yang dapat diverifikasi.');

        $record = $payments->findByUuid((string) $payment->uuid);
        abort_unless($record !== null, 404, 'Data pembayaran tidak ditemukan.');
        $webhooks->forceStatus($record, \App\Modules\Payments\Domain\ValueObjects\PaymentStatus::Paid, ['manual_verification' => true, 'verified_by' => $request->user()?->id]);

        $this->log($request, 'payment.verified', 'Payment', ['id' => $payment->id, 'before' => ['status' => 'pending'], 'after' => ['status' => 'paid']]);
        return response()->json(['data' => $payment->fresh()]);
    }

    /**
     * Refund (owner only): paid → refunded through the same state machine.
     * The actual money movement happens at the gateway/bank; this records the
     * outcome and keeps booking/payment state consistent.
     */
    public function paymentRefund(
        Request $request,
        string $id,
        \App\Modules\Payments\Application\Services\PaymentWebhookService $webhooks,
        \App\Modules\Payments\Domain\Repositories\PaymentRepository $payments,
    ): JsonResponse {
        abort_unless($request->user()?->role === 'owner', 403, 'Hanya owner yang dapat melakukan refund.');
        $payment = Payment::findOrFail($id);
        abort_unless(in_array($payment->status, ['paid', 'partial_refunded'], true), 422, 'Hanya pembayaran lunas yang dapat direfund.');

        $record = $payments->findByUuid((string) $payment->uuid);
        abort_unless($record !== null, 404, 'Data pembayaran tidak ditemukan.');
        $webhooks->forceStatus($record, \App\Modules\Payments\Domain\ValueObjects\PaymentStatus::Refunded, ['manual_refund' => true, 'refunded_by' => $request->user()?->id]);

        $this->log($request, 'payment.refunded', 'Payment', ['id' => $payment->id, 'before' => ['status' => $payment->status], 'after' => ['status' => 'refunded']]);
        return response()->json(['data' => $payment->fresh()]);
    }

    /** CSV export of payments honouring the active filters (incl. schedule_id). */
    public function paymentsExport(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $q = Payment::query()->with(['booking.customer.user:id,name', 'booking.schedule.route:id,origin,destination'])
            ->when($request->integer('schedule_id'), fn ($x, $id) => $x->whereHas('booking', fn ($b) => $b->where('schedule_id', $id)))
            ->when($request->string('status')->toString(), fn ($x, $s) => $x->where('status', $s))
            ->latest('id');

        $this->log($request, 'payment.exported', 'Payment', ['schedule_id' => $request->integer('schedule_id') ?: null]);

        return response()->streamDownload(function () use ($q): void {
            $out = fopen('php://output', 'w');
            fwrite($out, "\u{FEFF}");
            fputcsv($out, ['Referensi', 'Kode Booking', 'Customer', 'Rute', 'Metode', 'Jumlah', 'Status', 'Dibayar Pada', 'Dibuat']);
            $q->chunk(500, function ($rows) use ($out): void {
                foreach ($rows as $p) {
                    fputcsv($out, [
                        $p->reference,
                        $p->booking?->code,
                        $p->booking?->customer?->user?->name,
                        $p->booking?->schedule?->route ? $p->booking->schedule->route->origin.' - '.$p->booking->schedule->route->destination : '',
                        $p->method,
                        $p->amount,
                        $p->status,
                        $p->paid_at?->toISOString(),
                        $p->created_at?->toISOString(),
                    ]);
                }
            });
            fclose($out);
        }, 'stms-payments-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
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

    /**
     * Notification Center main list: one row per SEND ACTIVITY (broadcast,
     * personal, or draft) — never one row per recipient. Read/unread counts
     * are correlated subqueries over the recipients table, resolved in a
     * single SQL statement, so the list stays fast at 10⁵+ recipients.
     */
    public function notificationActivities(Request $request): JsonResponse
    {
        $recipientAgg = fn (?string $where = null) => DB::table('notifications')
            ->whereColumn('notifications.notification_activity_id', 'notification_activities.id')
            ->whereNull('notifications.deleted_at')
            ->when($where === 'read', fn ($x) => $x->whereNotNull('read_at'))
            ->when($where === 'unread', fn ($x) => $x->whereNull('read_at'))
            ->selectRaw('count(*)');

        $q = NotificationActivity::query()
            ->with(['sender:id,name,role', 'targetUser:id,name,role'])
            ->addSelect([
                'recipients_count' => $recipientAgg(),
                'read_count' => $recipientAgg('read'),
                'unread_count' => $recipientAgg('unread'),
            ]);

        if ($search = $request->string('search')->toString()) {
            $q->where(function ($query) use ($search): void {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhere('target_role', 'like', "%{$search}%")
                    ->orWhereHas('sender', fn ($s) => $s->where('name', 'like', "%{$search}%")->orWhere('role', 'like', "%{$search}%"))
                    ->orWhereHas('targetUser', fn ($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }
        // Filter: Semua / Broadcast / Personal / Draft / Terkirim / Gagal / Dibaca / Belum Dibaca.
        match ($request->string('filter')->toString()) {
            'broadcast' => $q->where('kind', 'broadcast'),
            'personal' => $q->where('kind', 'personal'),
            'draft' => $q->where('status', 'draft'),
            'sent' => $q->where('status', 'sent'),
            'failed' => $q->where('status', 'failed'),
            'read' => $q->where('status', 'sent')->whereDoesntHave('recipients', fn ($r) => $r->whereNull('read_at')),
            'unread' => $q->where('status', 'sent')->whereHas('recipients', fn ($r) => $r->whereNull('read_at')),
            default => null,
        };
        if ($from = $request->date('from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $q->where('created_at', '<=', \Illuminate\Support\Carbon::parse($to)->endOfDay());
        }
        if ($date = $request->string('date')->toString()) {
            $q->whereDate('created_at', $date);
        }

        return response()->json(['data' => $q->latest('id')->paginate($this->paginate($request))]);
    }

    /** Detail + statistics + recipient distribution per role (one grouped query). */
    public function notificationActivityShow(string $id): JsonResponse
    {
        $activity = NotificationActivity::with(['sender:id,name,role', 'targetUser:id,name,role'])->findOrFail($id);

        $stats = DB::table('notifications')
            ->where('notification_activity_id', $activity->id)
            ->whereNull('deleted_at')
            ->selectRaw('count(*) as total, sum(case when read_at is not null then 1 else 0 end) as read_count')
            ->first();

        $byRole = DB::table('notifications')
            ->join('users', 'users.id', '=', 'notifications.user_id')
            ->where('notifications.notification_activity_id', $activity->id)
            ->whereNull('notifications.deleted_at')
            ->selectRaw('users.role, count(*) as total, sum(case when notifications.read_at is not null then 1 else 0 end) as read_count')
            ->groupBy('users.role')
            ->orderByDesc('total')
            ->get();

        $total = (int) ($stats->total ?? 0);
        $read = (int) ($stats->read_count ?? 0);

        return response()->json(['data' => [
            'activity' => $activity,
            'stats' => [
                'total' => $total,
                'delivered' => $total,
                'failed' => (int) $activity->failed_count,
                'read' => $read,
                'unread' => $total - $read,
            ],
            'by_role' => $byRole,
        ]]);
    }

    /** Lazy, paginated recipients of one activity, optionally scoped to a role. */
    public function notificationActivityRecipients(Request $request, string $id): JsonResponse
    {
        $activity = NotificationActivity::findOrFail($id);
        $q = Notification::query()
            ->where('notification_activity_id', $activity->id)
            ->with('user:id,name,email,role')
            ->when($request->string('role')->toString(), fn ($x, $role) => $x->whereHas('user', fn ($u) => $u->where('role', $role)));

        $page = $q->orderBy('id')->paginate($this->paginate($request));
        $page->getCollection()->transform(fn (Notification $n) => [
            'id' => $n->id,
            'user' => $n->user?->only(['id', 'name', 'email', 'role']),
            'delivered' => true,
            'read' => $n->read_at !== null,
            'read_at' => $n->read_at,
        ]);

        return response()->json(['data' => $page]);
    }

    /** Create a draft or send immediately (send=true). */
    public function notificationActivityStore(Request $request): JsonResponse
    {
        $data = $this->validateActivityPayload($request);

        $activity = NotificationActivity::create([
            'sender_id' => $request->user()?->id,
            'kind' => $data['kind'],
            'target_role' => $data['kind'] === 'broadcast' ? $data['role'] : null,
            'target_user_id' => $data['kind'] === 'personal' ? $data['user_id'] : null,
            'type' => $data['type'] ?? ($data['kind'] === 'broadcast' ? 'broadcast' : 'personal'),
            'title' => $data['title'],
            'body' => $data['body'],
            'status' => 'draft',
        ]);

        if ($request->boolean('send')) {
            $this->dispatchActivity($activity);
            $this->log($request, 'notification.activity_sent', 'NotificationActivity', ['id' => $activity->id, 'title' => $activity->title, 'kind' => $activity->kind, 'count' => $activity->fresh()->sent_count]);
        } else {
            $this->log($request, 'notification.draft_created', 'NotificationActivity', ['id' => $activity->id, 'title' => $activity->title]);
        }

        return response()->json(['data' => $activity->fresh(['sender:id,name,role', 'targetUser:id,name,role'])], 201);
    }

    /** Edit a draft (sent activities are immutable history). */
    public function notificationActivityUpdate(Request $request, string $id): JsonResponse
    {
        $activity = NotificationActivity::findOrFail($id);
        abort_unless($activity->status === 'draft', 422, 'Hanya draft yang dapat diubah — aktivitas terkirim adalah riwayat.');

        $data = $this->validateActivityPayload($request);
        $before = $activity->only(['title', 'body', 'kind', 'target_role', 'target_user_id']);
        $activity->update([
            'kind' => $data['kind'],
            'target_role' => $data['kind'] === 'broadcast' ? $data['role'] : null,
            'target_user_id' => $data['kind'] === 'personal' ? $data['user_id'] : null,
            'title' => $data['title'],
            'body' => $data['body'],
        ]);
        $this->log($request, 'notification.draft_updated', 'NotificationActivity', ['id' => $activity->id, 'before' => $before, 'after' => $activity->only(['title', 'body', 'kind', 'target_role', 'target_user_id'])]);

        if ($request->boolean('send')) {
            $this->dispatchActivity($activity);
            $this->log($request, 'notification.activity_sent', 'NotificationActivity', ['id' => $activity->id, 'title' => $activity->title, 'kind' => $activity->kind, 'count' => $activity->fresh()->sent_count]);
        }

        return response()->json(['data' => $activity->fresh(['sender:id,name,role', 'targetUser:id,name,role'])]);
    }

    /** Delete a draft (sent activities are kept as audit history). */
    public function notificationActivityDestroy(Request $request, string $id): JsonResponse
    {
        $activity = NotificationActivity::findOrFail($id);
        abort_unless($activity->status === 'draft', 422, 'Hanya draft yang dapat dihapus.');
        $before = $activity->only(['title', 'kind', 'target_role']);
        $activity->delete();
        $this->log($request, 'notification.draft_deleted', 'NotificationActivity', ['id' => (int) $id, 'before' => $before]);
        return response()->json(['data' => ['deleted' => true]]);
    }

    /** Send an existing draft. */
    public function notificationActivitySend(Request $request, string $id): JsonResponse
    {
        $activity = NotificationActivity::findOrFail($id);
        abort_unless($activity->status === 'draft', 422, 'Aktivitas ini sudah terkirim.');
        $this->dispatchActivity($activity);
        $this->log($request, 'notification.activity_sent', 'NotificationActivity', ['id' => $activity->id, 'title' => $activity->title, 'kind' => $activity->kind, 'count' => $activity->fresh()->sent_count]);
        return response()->json(['data' => $activity->fresh(['sender:id,name,role', 'targetUser:id,name,role'])]);
    }

    /** @return array{kind: string, role: ?string, user_id: ?int, title: string, body: string, type: ?string} */
    private function validateActivityPayload(Request $request): array
    {
        $data = $request->validate([
            'kind' => 'required|string|in:broadcast,personal',
            'role' => 'required_if:kind,broadcast|nullable|string|in:all,customer,driver,admin,owner',
            'email' => 'required_if:kind,personal|nullable|email|exists:users,email',
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:2000',
            'type' => 'sometimes|nullable|string|max:64',
        ]);
        $userId = null;
        if ($data['kind'] === 'personal') {
            $userId = (int) User::where('email', $data['email'])->value('id');
        }
        return ['kind' => $data['kind'], 'role' => $data['role'] ?? null, 'user_id' => $userId, 'title' => $data['title'], 'body' => $data['body'], 'type' => $data['type'] ?? null];
    }

    /**
     * Insert per-recipient rows in 500-row chunks (memory-safe for broadcasts
     * to hundreds of thousands of users) and mark the activity sent.
     */
    private function dispatchActivity(NotificationActivity $activity): void
    {
        $recipients = $activity->kind === 'personal'
            ? User::query()->whereKey($activity->target_user_id)
            : User::query()->where('is_active', true)->when($activity->target_role !== 'all', fn ($q) => $q->where('role', $activity->target_role));

        $created = 0;
        $sentAt = now();
        $recipients->select('id')->chunkById(500, function ($users) use ($activity, $sentAt, &$created): void {
            $rows = $users->map(fn ($user) => [
                'uuid' => (string) Str::uuid(),
                'user_id' => $user->id,
                'notification_activity_id' => $activity->id,
                'type' => $activity->type,
                'title' => $activity->title,
                'body' => $activity->body,
                'metadata' => json_encode(['activity_id' => $activity->id, 'broadcast_by' => $activity->sender_id]),
                'created_at' => $sentAt,
                'updated_at' => $sentAt,
            ])->all();
            DB::table('notifications')->insert($rows);
            $created += count($rows);
        });

        $activity->update(['status' => $created > 0 ? 'sent' : 'failed', 'sent_count' => $created, 'sent_at' => $sentAt]);
    }

    /**
     * Legacy targeted-send endpoint — kept for backward compatibility; now
     * routed through an activity so it appears in the Notification Center.
     */
    public function notificationStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:2000',
            'type' => 'sometimes|string|max:64',
            'target' => 'required|string|in:user,role,all',
            'user_id' => 'required_if:target,user|integer|exists:users,id',
            'role' => 'required_if:target,role|string|in:customer,driver,admin,owner',
        ]);

        $activity = NotificationActivity::create([
            'sender_id' => $request->user()?->id,
            'kind' => $data['target'] === 'user' ? 'personal' : 'broadcast',
            'target_role' => $data['target'] === 'user' ? null : ($data['target'] === 'all' ? 'all' : $data['role']),
            'target_user_id' => $data['target'] === 'user' ? $data['user_id'] : null,
            'type' => $data['type'] ?? 'system_announcement',
            'title' => $data['title'],
            'body' => $data['body'],
            'status' => 'draft',
        ]);
        $this->dispatchActivity($activity);
        $created = $activity->fresh()->sent_count;

        $this->log($request, 'notification.created', 'Notification', ['target' => $data['target'], 'count' => $created, 'activity_id' => $activity->id]);
        return response()->json(['success' => true, 'message' => "Notifikasi terkirim ke {$created} pengguna.", 'data' => ['created' => $created]], 201);
    }

    /**
     * Legacy broadcast endpoint — kept for backward compatibility; now routed
     * through an activity so it appears grouped in the Notification Center.
     */
    public function notificationBroadcast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:2000',
            'role' => 'required|string|in:customer,driver,admin,owner,all',
            'type' => 'nullable|string|max:50',
        ]);

        $activity = NotificationActivity::create([
            'sender_id' => $request->user()?->id,
            'kind' => 'broadcast',
            'target_role' => $data['role'],
            'type' => $data['type'] ?? 'broadcast',
            'title' => $data['title'],
            'body' => $data['body'],
            'status' => 'draft',
        ]);
        $this->dispatchActivity($activity);
        $sent = $activity->fresh()->sent_count;

        // Summary entry powering the (legacy) broadcast history view.
        $this->log($request, 'notification.broadcast', 'Notification', [
            'broadcast_id' => (string) $activity->uuid,
            'activity_id' => $activity->id,
            'title' => $data['title'],
            'body' => Str::limit($data['body'], 500),
            'role' => $data['role'],
            'count' => $sent,
            'sent_at' => $activity->fresh()->sent_at?->toISOString(),
        ]);

        return response()->json(['data' => ['sent' => $sent, 'broadcast_id' => (string) $activity->uuid]], 201);
    }

    /**
     * Legacy broadcast history endpoint — now reads from activities directly
     * (same shape as before, so existing clients keep working).
     */
    public function notificationBroadcasts(Request $request): JsonResponse
    {
        $page = NotificationActivity::query()
            ->with('sender:id,name')
            ->where('kind', 'broadcast')
            ->where('status', '!=', 'draft')
            ->addSelect(['read_count' => DB::table('notifications')
                ->whereColumn('notifications.notification_activity_id', 'notification_activities.id')
                ->whereNotNull('read_at')
                ->whereNull('deleted_at')
                ->selectRaw('count(*)')])
            ->latest('id')
            ->paginate($this->paginate($request));

        $page->getCollection()->transform(fn (NotificationActivity $a) => [
            'id' => $a->id,
            'broadcast_id' => (string) $a->uuid,
            'title' => $a->title,
            'body' => $a->body,
            'role' => $a->target_role ?? 'all',
            'sent_by' => $a->sender?->name,
            'delivered' => (int) $a->sent_count,
            'read' => (int) ($a->read_count ?? 0),
            'status' => $a->sent_count > 0 ? 'delivered' : 'empty',
            'sent_at' => $a->sent_at?->toISOString(),
        ]);

        return response()->json(['data' => $page]);
    }

    // ----- Reports & activity logs -----
    /** @return array{from: \Illuminate\Support\Carbon, to: \Illuminate\Support\Carbon} */
    private function reportRange(Request $request): array
    {
        // Named periods for one-tap filters; custom from/to still supported.
        $period = $request->string('period')->toString();
        [$from, $to] = match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            default => [$request->date('from') ?? now()->subDays(30), $request->date('to') ?? now()],
        };
        return ['from' => \Illuminate\Support\Carbon::parse($from), 'to' => \Illuminate\Support\Carbon::parse($to)];
    }

    /** @return array<string, mixed> */
    private function reportData(Request $request): array
    {
        ['from' => $from, 'to' => $to] = $this->reportRange($request);
        return [
            'from' => $from->toISOString(),
            'to' => $to->toISOString(),
            'bookings_total' => Booking::whereBetween('created_at', [$from, $to])->count(),
            'bookings_by_status' => Booking::whereBetween('created_at', [$from, $to])->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'revenue_total' => (float) Payment::where('status', 'paid')->whereBetween('paid_at', [$from, $to])->sum('amount'),
            'payments_by_status' => Payment::whereBetween('created_at', [$from, $to])->select('status', DB::raw('count(*) as total'))->groupBy('status')->pluck('total', 'status'),
            'active_customers' => Customer::whereHas('user', fn ($q) => $q->where('is_active', true))->count(),
            'active_drivers' => Driver::where('status', '!=', 'suspended')->count(),
            'active_vehicles' => Vehicle::where('status', 'active')->count(),
            'tickets_checked_in' => Ticket::whereNotNull('checked_in_at')->whereBetween('checked_in_at', [$from, $to])->count(),
        ];
    }

    public function reports(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->reportData($request)]);
    }

    /**
     * Export the operational report as CSV (`format=csv`, default) or an
     * Excel-compatible file (`format=excel`, CSV with UTF-8 BOM so Excel
     * opens it with correct encoding). PDF is produced client-side via the
     * print stylesheet to avoid adding a PDF dependency to the runtime.
     */
    public function reportsExport(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $data = $this->reportData($request);
        $format = $request->string('format')->toString() ?: 'csv';
        $filename = 'stms-report-'.now()->format('Ymd-His').($format === 'excel' ? '.xls.csv' : '.csv');

        $this->log($request, 'report.exported', 'Report', ['format' => $format, 'from' => $data['from'], 'to' => $data['to']]);

        return response()->streamDownload(function () use ($data, $format): void {
            $out = fopen('php://output', 'w');
            if ($format === 'excel') {
                fwrite($out, "\u{FEFF}"); // BOM: Excel-safe UTF-8
            }
            fputcsv($out, ['Metrik', 'Nilai']);
            fputcsv($out, ['Periode', $data['from'].' s/d '.$data['to']]);
            fputcsv($out, ['Total booking', $data['bookings_total']]);
            fputcsv($out, ['Total revenue (paid)', $data['revenue_total']]);
            fputcsv($out, ['Customer aktif', $data['active_customers']]);
            fputcsv($out, ['Driver aktif', $data['active_drivers']]);
            fputcsv($out, ['Armada aktif', $data['active_vehicles']]);
            fputcsv($out, ['Tiket check-in', $data['tickets_checked_in']]);
            fputcsv($out, []);
            fputcsv($out, ['Booking per status', 'Jumlah']);
            foreach ($data['bookings_by_status'] as $status => $total) {
                fputcsv($out, [$status, $total]);
            }
            fputcsv($out, []);
            fputcsv($out, ['Pembayaran per status', 'Jumlah']);
            foreach ($data['payments_by_status'] as $status => $total) {
                fputcsv($out, [$status, $total]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function activityLogQuery(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $q = ActivityLog::query();
        if ($search = $request->string('search')->toString()) {
            $q->where(fn ($query) => $query
                ->where('action', 'like', "%{$search}%")
                ->orWhere('subject_type', 'like', "%{$search}%")
                ->orWhere('metadata', 'like', "%{$search}%"));
        }
        if ($action = $request->string('action')->toString()) {
            $q->where('action', 'like', "{$action}%");
        }
        if ($from = $request->date('from')) {
            $q->where('created_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $q->where('created_at', '<=', \Illuminate\Support\Carbon::parse($to)->endOfDay());
        }
        $sort = in_array($request->string('sort')->toString(), ['id', 'action', 'subject_type', 'created_at'], true) ? $request->string('sort')->toString() : 'id';
        $dir = $request->string('dir')->toString() === 'asc' ? 'asc' : 'desc';
        return $q->orderBy($sort, $dir);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->activityLogQuery($request)->paginate($this->paginate($request))]);
    }

    /** CSV export of the (filtered) audit log for compliance/archival. */
    public function activityLogsExport(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = $this->activityLogQuery($request);
        $this->log($request, 'audit_log.exported', 'ActivityLog', []);

        return response()->streamDownload(function () use ($query): void {
            $out = fopen('php://output', 'w');
            fwrite($out, "\u{FEFF}");
            fputcsv($out, ['ID', 'Aksi', 'Objek', 'Objek ID', 'User', 'Role', 'IP', 'Device', 'Browser', 'Sebelum', 'Sesudah', 'Waktu']);
            $query->chunk(500, function ($rows) use ($out): void {
                foreach ($rows as $row) {
                    $meta = $row->metadata ?? [];
                    fputcsv($out, [
                        $row->id,
                        $row->action,
                        class_basename((string) $row->subject_type),
                        $row->subject_id,
                        $meta['actor']['name'] ?? '',
                        $meta['actor']['role'] ?? '',
                        $meta['ip'] ?? '',
                        $meta['device'] ?? '',
                        $meta['browser'] ?? '',
                        isset($meta['before']) ? json_encode($meta['before'], JSON_UNESCAPED_UNICODE) : '',
                        isset($meta['after']) ? json_encode($meta['after'], JSON_UNESCAPED_UNICODE) : '',
                        $row->created_at?->toISOString(),
                    ]);
                }
            });
            fclose($out);
        }, 'stms-audit-log-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    // ----- System settings -----
    public function settings(): JsonResponse
    {
        return response()->json(['data' => \App\Models\SystemSetting::query()->orderBy('key')->get()]);
    }

    public function settingsUpdate(Request $request): JsonResponse
    {
        $data = $request->validate(['key' => 'required|string|max:150', 'value' => 'required', 'is_public' => 'sometimes|boolean']);
        $existing = \App\Models\SystemSetting::where('key', $data['key'])->first();
        $before = $existing?->value;
        $setting = \App\Models\SystemSetting::updateOrCreate(['key' => $data['key']], ['value' => $data['value'], 'is_public' => $data['is_public'] ?? false]);
        if ($setting->key === \App\Support\Settings\SettingKey::MaintenanceMode->value) {
            cache()->forget('settings.maintenance_mode');
        }
        $this->log($request, 'setting.updated', 'SystemSetting', ['key' => $setting->key, 'before' => $before, 'after' => $setting->value]);
        return response()->json(['data' => $setting]);
    }

    /**
     * Upload an image used by settings (e.g. the welcome notification banner).
     * Stored on the public disk; returns the public URL, which the client then
     * saves into the relevant setting key.
     */
    public function settingsUpload(Request $request): JsonResponse
    {
        $request->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096']);
        $path = $request->file('image')->store('settings', 'public');
        $this->log($request, 'setting.image_uploaded', 'SystemSetting', ['path' => $path]);
        return response()->json(['data' => ['path' => $path, 'url' => asset('storage/'.$path)]], 201);
    }
}
