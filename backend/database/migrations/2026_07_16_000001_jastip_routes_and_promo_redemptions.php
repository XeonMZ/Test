<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * #3 Jastip becomes route-based: every order belongs to a Route so customers
 *    and drivers only see packages relevant to the corridor they use.
 * #9 Promo/voucher single-use: a permanent per-customer redemption ledger with
 *    a UNIQUE(promo_id, customer_id) constraint — one lifetime use per account,
 *    enforced at the database layer regardless of device/session tricks.
 *
 * Safe on populated databases: route_id is added nullable so existing jastip
 * rows keep working; new orders are validated as required at the API layer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jastip_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('jastip_orders', 'route_id')) {
                $table->foreignId('route_id')->nullable()->after('driver_id')
                    ->constrained('routes')->nullOnDelete();
                $table->index(['route_id', 'status']);
            }
        });

        if (! Schema::hasTable('promo_redemptions')) {
            Schema::create('promo_redemptions', function (Blueprint $table): void {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->foreignId('promo_id')->constrained()->cascadeOnDelete();
                $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
                $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
                $table->timestamps();
                // One lifetime redemption per promo per customer — permanent.
                $table->unique(['promo_id', 'customer_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_redemptions');
        Schema::table('jastip_orders', function (Blueprint $table): void {
            if (Schema::hasColumn('jastip_orders', 'route_id')) {
                $table->dropConstrainedForeignId('route_id');
            }
        });
    }
};
