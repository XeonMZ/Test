<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Live Trip Tracking: per-booking pickup/drop progress + customer note, and
 * jastip contact phones + progress timestamps. Purely additive — existing
 * columns (pickup/drop lat/lng/label from the customer-experience migration
 * and the driver_locations GPS table) are reused, not duplicated.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            foreach ([
                'pickup_note' => fn () => $table->string('pickup_note', 500)->nullable(),
                'picked_up_at' => fn () => $table->timestamp('picked_up_at')->nullable()->index(),
                'dropped_off_at' => fn () => $table->timestamp('dropped_off_at')->nullable(),
            ] as $col => $add) {
                if (! Schema::hasColumn('bookings', $col)) {
                    $add();
                }
            }
        });

        Schema::table('jastip_orders', function (Blueprint $table): void {
            foreach ([
                'sender_phone' => fn () => $table->string('sender_phone', 32)->nullable(),
                'receiver_phone' => fn () => $table->string('receiver_phone', 32)->nullable(),
                'picked_up_at' => fn () => $table->timestamp('picked_up_at')->nullable(),
                'delivered_at' => fn () => $table->timestamp('delivered_at')->nullable(),
            ] as $col => $add) {
                if (! Schema::hasColumn('jastip_orders', $col)) {
                    $add();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            foreach (['pickup_note', 'picked_up_at', 'dropped_off_at'] as $col) {
                if (Schema::hasColumn('bookings', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        Schema::table('jastip_orders', function (Blueprint $table): void {
            foreach (['sender_phone', 'receiver_phone', 'picked_up_at', 'delivered_at'] as $col) {
                if (Schema::hasColumn('jastip_orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
