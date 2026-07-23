<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Automatic online payment for package bookings. Reuses the SAME
 * PaymentGateway contract (Midtrans/Beta) and webhook verification as travel
 * bookings; because the `payments` table is FK-bound to travel `bookings`,
 * the gateway state for packages lives on the package_bookings row itself
 * (payment_uuid = gateway order_id). Manual transfer remains supported.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('package_bookings', function (Blueprint $table): void {
            $table->uuid('payment_uuid')->nullable()->unique()->after('status');
            $table->string('payment_method', 32)->nullable()->after('payment_uuid'); // manual | snap | qris | bank_transfer
            $table->string('payment_reference')->nullable()->after('payment_method');
            $table->json('payment_payload')->nullable()->after('payment_reference');
            $table->timestamp('payment_expires_at')->nullable()->after('payment_payload');
        });
    }

    public function down(): void
    {
        Schema::table('package_bookings', function (Blueprint $table): void {
            $table->dropColumn(['payment_uuid', 'payment_method', 'payment_reference', 'payment_payload', 'payment_expires_at']);
        });
    }
};
