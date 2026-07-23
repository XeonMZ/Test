<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Mail\PackageBookingMail;
use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\PackageBooking;
use App\Models\SystemSetting;
use App\Models\TourPackage;
use App\Support\Audit\RequestContext;
use App\Support\Mail\TransactionalMailer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * End-to-end tour package booking.
 * Customer: create (capacity-guarded, anti-spam cooldown, verified email) →
 * pay by transfer → "Sudah Transfer" → admin verifies → paid (+invoice email
 * + notification) → completed. Every transition is atomic (conditional
 * UPDATE), audited, and emailed through the queued Resend pipeline.
 */
final class PackageBookingController extends Controller
{
    public function __construct(private readonly TransactionalMailer $mailer) {}

    // ---------------------------- Customer ----------------------------

    /**
     * Create a booking. `payment_type` decides whether the customer pays the
     * whole amount now or only a down payment.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tour_package_id' => 'required|integer|exists:tour_packages,id',
            'travel_date' => 'required|date|after_or_equal:today',
            'pax' => 'required|integer|min:1|max:100',
            'contact_phone' => 'sometimes|nullable|string|max:30',
            'notes' => 'sometimes|nullable|string|max:1000',
            'payment_type' => 'sometimes|string|in:full,dp',
        ]);
        $customer = Customer::where('user_id', $request->user()->id)->firstOrFail();
        $wantsDp = ($data['payment_type'] ?? 'full') === 'dp';

        $booking = DB::transaction(function () use ($data, $customer, $wantsDp): PackageBooking {
            $package = TourPackage::whereKey($data['tour_package_id'])->where('status', 'active')->lockForUpdate()->firstOrFail();
            if ((int) $package->capacity > 0) {
                $taken = (int) PackageBooking::where('tour_package_id', $package->id)
                    ->whereDate('travel_date', $data['travel_date'])
                    ->whereIn('status', PackageBooking::ACTIVE_STATUSES)
                    ->sum('pax');
                abort_if($taken + (int) $data['pax'] > (int) $package->capacity, 422, 'Kapasitas paket pada tanggal tersebut tidak mencukupi (tersisa '.max(0, $package->capacity - $taken).' pax).');
            }

            $amount = round((float) $package->price * (int) $data['pax'], 2);

            // The percentage is read once and frozen onto the row. Reading it
            // again at settlement time would let an admin edit the setting and
            // silently re-price a booking a customer has already committed to.
            $dpPercent = null;
            $dpAmount = null;
            if ($wantsDp) {
                abort_unless($this->dpEnabled(), 422, 'Pembayaran DP sedang tidak tersedia untuk paket wisata.');
                $dpPercent = $this->dpPercent();
                $dpAmount = round($amount * $dpPercent / 100, 2);
                // A DP that rounds to the whole amount is not a DP; fall back
                // to a normal full payment rather than creating a booking with
                // a zero remainder that still shows a settlement button.
                if ($dpAmount >= $amount) {
                    $dpPercent = null;
                    $dpAmount = null;
                }
            }

            return PackageBooking::create([
                'tour_package_id' => $package->id,
                'customer_id' => $customer->id,
                'travel_date' => $data['travel_date'],
                'pax' => (int) $data['pax'],
                'amount' => $amount,
                'payment_type' => $dpAmount === null ? 'full' : 'dp',
                'dp_percent' => $dpPercent,
                'dp_amount' => $dpAmount,
                'paid_amount' => 0,
                'contact_phone' => $data['contact_phone'] ?? $customer->phone,
                'notes' => $data['notes'] ?? null,
                'status' => 'waiting_payment',
            ]);
        });

        $instructions = $this->instructions();
        $due = $this->idr($booking->amountDueNow());
        $this->notify(
            $request->user()->id,
            'Booking paket diterima',
            $booking->is_dp
                ? "Booking {$booking->code} tercatat. Bayar DP {$due} lalu tekan Sudah Transfer. Sisa pelunasan dapat dibayar setelah DP terverifikasi."
                : "Booking {$booking->code} tercatat. Selesaikan pembayaran {$due} lalu tekan Sudah Transfer.",
        );
        $this->email($booking, 'received', $instructions);
        $this->audit($request, 'package_booking.created', ['id' => $booking->id, 'code' => $booking->code, 'pax' => $booking->pax, 'payment_type' => $booking->payment_type, 'due_now' => $booking->amountDueNow()]);

        return response()->json(['data' => [
            'booking' => $booking->load('tourPackage:id,name,destination'),
            'payment_instructions' => $instructions,
            'amount_due_now' => $booking->amountDueNow(),
        ]], 201);
    }

    public function myIndex(Request $request): JsonResponse
    {
        $customer = Customer::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json(['data' => PackageBooking::with('tourPackage:id,name,destination,duration_days,cover_path')
            ->where('customer_id', $customer->id)->latest('id')->paginate(20)]);
    }

    /** Customer declares the transfer has been made — atomic, race-safe. */
    public function confirmTransfer(Request $request, string $uuid): JsonResponse
    {
        $booking = $this->ownedBooking($request, $uuid);
        $updated = PackageBooking::whereKey($booking->id)->where('status', 'waiting_payment')->update(['status' => 'waiting_verification']);
        abort_if($updated === 0, 422, 'Booking tidak dalam status menunggu pembayaran.');
        $this->audit($request, 'package_booking.transfer_confirmed', ['id' => $booking->id, 'code' => $booking->code]);
        return response()->json(['data' => ['status' => 'waiting_verification', 'message' => 'Terima kasih! Tim kami akan memverifikasi pembayaran Anda.']]);
    }

    /**
     * Pay online through the payment gateway (automatic verification via
     * webhook). Reuses the same gateway as travel bookings. Manual transfer
     * (confirmTransfer) remains available as an alternative.
     */
    public function pay(Request $request, string $uuid, \App\Http\Controllers\Support\PackagePaymentService $payments): JsonResponse
    {
        $method = (string) $request->validate(['method' => 'required|string|in:snap,qris,bank_transfer'])['method'];
        $booking = $this->ownedBooking($request, $uuid);
        $result = $payments->charge($booking, $method);
        $this->audit($request, 'package_booking.payment_created', ['id' => $booking->id, 'code' => $booking->code, 'method' => $method, 'kind' => 'first']);
        return response()->json(['data' => $result]);
    }

    /** Pay the remaining balance of a DP booking through the gateway. */
    public function settle(Request $request, string $uuid, \App\Http\Controllers\Support\PackagePaymentService $payments): JsonResponse
    {
        $method = (string) $request->validate(['method' => 'required|string|in:snap,qris,bank_transfer'])['method'];
        $booking = $this->ownedBooking($request, $uuid);
        $result = $payments->settle($booking, $method);
        $this->audit($request, 'package_booking.settlement_created', ['id' => $booking->id, 'code' => $booking->code, 'method' => $method, 'kind' => 'settlement']);
        return response()->json(['data' => $result]);
    }

    /**
     * Customer declares the REMAINDER was transferred manually.
     *
     * This cannot reuse confirmTransfer(): the booking is already `paid` (the
     * DP secured it), so there is no status left to move. The claim is
     * recorded on its own timestamp and awaits verifySettlement().
     */
    public function confirmSettlement(Request $request, string $uuid): JsonResponse
    {
        $booking = $this->ownedBooking($request, $uuid);
        abort_unless($booking->awaitingSettlement(), 422, 'Booking tidak memiliki sisa pembayaran yang menunggu konfirmasi.');

        // Conditional update keeps concurrent taps from double-claiming.
        $updated = PackageBooking::whereKey($booking->id)
            ->where('status', 'paid')
            ->whereNull('settled_at')
            ->whereNull('settlement_claimed_at')
            ->update(['settlement_claimed_at' => now()]);
        abort_if($updated === 0, 422, 'Konfirmasi pelunasan sudah tercatat sebelumnya.');

        $this->audit($request, 'package_booking.settlement_claimed', ['id' => $booking->id, 'code' => $booking->code]);
        return response()->json(['data' => ['message' => 'Terima kasih! Tim kami akan memverifikasi pelunasan Anda.']]);
    }

    public function customerCancel(Request $request, string $uuid): JsonResponse
    {
        $booking = $this->ownedBooking($request, $uuid);
        $updated = PackageBooking::whereKey($booking->id)->whereIn('status', ['waiting_payment', 'waiting_verification'])->update(['status' => 'cancelled']);
        abort_if($updated === 0, 422, 'Booking tidak dapat dibatalkan pada status saat ini.');
        $this->email($booking->refresh(), 'cancelled');
        $this->audit($request, 'package_booking.cancelled_by_customer', ['id' => $booking->id, 'code' => $booking->code]);
        return response()->json(['data' => ['status' => 'cancelled']]);
    }

    // ----------------------------- Admin ------------------------------

    public function adminIndex(Request $request): JsonResponse
    {
        $q = PackageBooking::with(['tourPackage:id,name,destination', 'customer.user:id,name,email']);
        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($search = $request->string('search')->toString()) {
            $q->where(fn ($x) => $x->where('code', 'like', "%{$search}%")
                ->orWhereHas('customer.user', fn ($u) => $u->where('name', 'like', "%{$search}%")));
        }
        return response()->json(['data' => $q->latest('id')->paginate(min(100, max(1, (int) $request->query('per_page', '20'))))]);
    }

    /** Verify the transfer → paid + confirmation email + notification. */
    public function verify(Request $request, string $id, \App\Http\Controllers\Support\PackagePaymentService $payments): JsonResponse
    {
        $booking = PackageBooking::with('customer')->findOrFail($id);

        // Delegated so the manual and gateway paths credit the same figure
        // through the same locked, idempotent code.
        abort_unless($payments->applyFirstPayment((int) $booking->id), 422, 'Booking tidak dalam status yang dapat diverifikasi.');

        $booking->refresh();
        if ($booking->customer?->user_id) {
            $this->notify(
                $booking->customer->user_id,
                'Pembayaran paket terverifikasi',
                $booking->is_settled
                    ? "Booking {$booking->code} terkonfirmasi dan LUNAS. Sampai jumpa di tanggal keberangkatan!"
                    : "DP booking {$booking->code} terkonfirmasi. Sisa pembayaran {$this->idr($booking->outstanding_amount)} dapat dilunasi kapan saja sebelum keberangkatan.",
            );
        }
        $this->email($booking, 'paid');
        $this->audit($request, 'package_booking.verified', ['id' => $booking->id, 'code' => $booking->code]);
        return response()->json(['data' => $booking]);
    }

    /** Reject the claim (e.g. transfer not found) with a note back to the customer. */
    public function reject(Request $request, string $id): JsonResponse
    {
        $note = (string) $request->validate(['admin_note' => 'required|string|max:500'])['admin_note'];
        $booking = PackageBooking::with('customer')->findOrFail($id);
        $updated = PackageBooking::whereKey($booking->id)->where('status', 'waiting_verification')->update(['status' => 'waiting_payment', 'admin_note' => $note]);
        abort_if($updated === 0, 422, 'Booking tidak dalam status menunggu verifikasi.');
        if ($booking->customer?->user_id) {
            $this->notify($booking->customer->user_id, 'Verifikasi pembayaran ditolak', "Booking {$booking->code}: {$note}");
        }
        $this->audit($request, 'package_booking.rejected', ['id' => $booking->id, 'code' => $booking->code, 'note' => $note]);
        return response()->json(['data' => $booking->refresh()]);
    }

    /**
     * Admin confirms the remaining balance was received (transfer or cash).
     *
     * Separate from verify() because it credits a different instalment; using
     * one endpoint for both would make it impossible to tell from the audit
     * trail which payment an admin actually confirmed.
     */
    public function verifySettlement(Request $request, string $id, \App\Http\Controllers\Support\PackagePaymentService $payments): JsonResponse
    {
        $booking = PackageBooking::with('customer')->findOrFail($id);
        abort_unless($payments->applySettlement((int) $booking->id), 422, 'Booking tidak memiliki sisa pembayaran yang bisa dilunasi.');

        $booking->refresh();
        if ($booking->customer?->user_id) {
            $this->notify($booking->customer->user_id, 'Pelunasan terverifikasi', "Booking {$booking->code} kini LUNAS. Terima kasih!");
        }
        $this->email($booking, 'paid');
        $this->audit($request, 'package_booking.settlement_verified', ['id' => $booking->id, 'code' => $booking->code, 'amount' => $booking->amount]);

        return response()->json(['data' => $booking]);
    }

    public function adminTransition(Request $request, string $id, string $action): JsonResponse
    {
        abort_unless(in_array($action, ['complete', 'cancel'], true), 404);
        $booking = PackageBooking::with('customer')->findOrFail($id);

        // A DP booking must not be closed while money is still owed —
        // `completed` is terminal and also unlocks rating eligibility, so
        // letting it through would quietly write off the outstanding balance.
        // Admins who took the remainder in cash record it via
        // verifySettlement() first; nothing is lost, it just has to be stated.
        if ($action === 'complete' && ! $booking->is_settled) {
            abort(422, 'Booking belum lunas (sisa '.$this->idr($booking->outstanding_amount).'). Verifikasi pelunasan terlebih dahulu sebelum menyelesaikan booking.');
        }

        $map = ['complete' => [['paid'], 'completed'], 'cancel' => [PackageBooking::ACTIVE_STATUSES, 'cancelled']];
        [$from, $to] = $map[$action];
        $updated = PackageBooking::whereKey($booking->id)->whereIn('status', $from)->update(['status' => $to]);
        abort_if($updated === 0, 422, 'Transisi status tidak valid untuk booking ini.');
        if ($to === 'cancelled') {
            $this->email($booking->refresh(), 'cancelled');
        }
        $this->audit($request, "package_booking.{$to}", ['id' => $booking->id, 'code' => $booking->code]);
        return response()->json(['data' => $booking->refresh()]);
    }

    // ----------------------------- Helpers -----------------------------

    private function ownedBooking(Request $request, string $uuid): PackageBooking
    {
        $customer = Customer::where('user_id', $request->user()->id)->firstOrFail();
        return PackageBooking::where('uuid', $uuid)->where('customer_id', $customer->id)->firstOrFail();
    }

    /** DP is a tour-package feature; travel bookings keep their own setting. */
    private function dpEnabled(): bool
    {
        return filter_var($this->setting('package_dp_enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
    }

    /** Clamped to 1..99 so a bad setting can never produce a zero or full DP. */
    private function dpPercent(): int
    {
        $value = (int) ($this->setting('package_dp_percent') ?? 30);

        return max(1, min(99, $value === 0 ? 30 : $value));
    }

    /** Settings are cast to array, so a scalar may arrive wrapped as ['value' => x]. */
    private function setting(string $key): string|int|bool|null
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        if (is_array($value)) {
            $value = $value['value'] ?? null;
        }

        return is_scalar($value) ? $value : null;
    }

    private function idr(float $amount): string
    {
        return 'Rp'.number_format($amount, 0, ',', '.');
    }

    private function instructions(): string
    {
        $value = SystemSetting::query()->where('key', 'package_payment_instructions')->value('value');
        $text = is_array($value) ? ($value['value'] ?? null) : $value;
        return (string) ($text ?: 'Transfer ke rekening resmi SJT Travel (lihat menu Kontak), lalu tekan tombol "Sudah Transfer".');
    }

    private function email(PackageBooking $booking, string $stage, ?string $instructions = null): void
    {
        $email = $booking->loadMissing('customer.user')->customer?->user?->email;
        if (! $email) {
            return;
        }
        $this->mailer->queue('package_booking', (string) $email, 'Package Booking - SJT Travel',
            new PackageBookingMail($booking->id, $stage, $instructions),
            "pkg:{$booking->uuid}:{$stage}", $booking->customer?->user_id, ['code' => $booking->code]);
    }

    private function notify(int $userId, string $title, string $body): void
    {
        Notification::create(['user_id' => $userId, 'type' => 'package_booking', 'title' => $title, 'body' => $body]);
    }

    private function audit(Request $request, string $action, array $meta): void
    {
        $meta = RequestContext::enrich($request, $meta);
        AuditTrail::record($action, 'PackageBooking', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => $action, 'subject_type' => 'PackageBooking', 'subject_id' => $meta['id'] ?? null, 'metadata' => $meta]);
    }
}
