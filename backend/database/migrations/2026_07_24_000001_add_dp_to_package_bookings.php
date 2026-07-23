<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Down payment for tour package bookings.
 *
 * Deliberately scoped to packages only. Travel bookings already have their own
 * DP mechanism in PaymentService, driven by the `payment_dp_enabled` setting
 * and derived from sum(payments); packages cannot reuse it because the
 * `payments` table is FK-bound to travel `bookings`. So package DP state lives
 * on this row, exactly like the gateway columns already do.
 *
 * Design note — no new statuses. `status` keeps meaning "is this booking
 * secured", and settlement is a separate dimension read from
 * `paid_amount` vs `amount`. Adding a `dp_paid` status would have silently
 * broken every existing `status === 'paid'` check in the admin UI, the
 * capacity guard (ACTIVE_STATUSES) and the rating-eligibility rule.
 *
 * The backfill is the important part: without it every already-paid booking
 * would read as paid_amount = 0, i.e. fully unsettled, which would block
 * admins from completing them and would show phantom outstanding balances to
 * customers who owe nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('package_bookings', function (Blueprint $table): void {
            // 'full' | 'dp' — chosen by the customer at booking time.
            $table->string('payment_type', 8)->default('full')->after('amount');
            $table->unsignedTinyInteger('dp_percent')->nullable()->after('payment_type');
            // The first instalment due. Frozen at booking time so a later
            // change to the DP percentage setting cannot re-price an
            // outstanding booking underneath the customer.
            $table->decimal('dp_amount', 12, 2)->nullable()->after('dp_percent');
            // Cumulative amount actually received.
            $table->decimal('paid_amount', 12, 2)->default(0)->after('dp_amount');

            $table->timestamp('settled_at')->nullable()->after('paid_at');
            // Customer claims the remainder was transferred; awaits admin.
            $table->timestamp('settlement_claimed_at')->nullable()->after('settled_at');

            // Second gateway charge, mirroring the payment_* columns.
            $table->uuid('settlement_uuid')->nullable()->unique()->after('payment_expires_at');
            $table->string('settlement_method', 32)->nullable()->after('settlement_uuid');
            $table->string('settlement_reference')->nullable()->after('settlement_method');
            $table->json('settlement_payload')->nullable()->after('settlement_reference');
            $table->timestamp('settlement_expires_at')->nullable()->after('settlement_payload');
        });

        // Everything that already reached paid/completed was, by definition of
        // the old binary flow, paid in full.
        DB::table('package_bookings')
            ->whereIn('status', ['paid', 'completed'])
            ->update([
                'payment_type' => 'full',
                'paid_amount' => DB::raw('amount'),
                'settled_at' => DB::raw('COALESCE(paid_at, updated_at)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('package_bookings', function (Blueprint $table): void {
            $table->dropColumn([
                'payment_type', 'dp_percent', 'dp_amount', 'paid_amount',
                'settled_at', 'settlement_claimed_at',
                'settlement_uuid', 'settlement_method', 'settlement_reference',
                'settlement_payload', 'settlement_expires_at',
            ]);
        });
    }
};
