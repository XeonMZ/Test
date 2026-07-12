<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->timestamp('expires_at')->nullable()->index()->after('amount');
            $table->timestamp('paid_at')->nullable()->after('expires_at');
            $table->timestamp('cancelled_at')->nullable()->after('paid_at');
        });
        Schema::table('seat_reservations', function (Blueprint $table): void {
            $table->timestamp('locked_until')->nullable()->index()->after('status');
            $table->timestamp('released_at')->nullable()->after('locked_until');
            $table->index(['vehicle_seat_id', 'status', 'locked_until'], 'seat_reservations_lock_lookup_index');
        });
    }
    public function down(): void
    {
        Schema::table('seat_reservations', function (Blueprint $table): void {
            $table->dropIndex('seat_reservations_lock_lookup_index');
            $table->dropColumn(['locked_until', 'released_at']);
        });
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn(['expires_at', 'paid_at', 'cancelled_at']);
        });
    }
};
