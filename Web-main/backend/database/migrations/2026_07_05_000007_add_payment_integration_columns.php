<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->string('method')->default('snap')->after('provider');
            $table->string('idempotency_key')->nullable()->unique()->after('status');
            $table->string('gateway_reference')->nullable()->unique()->after('idempotency_key');
            $table->json('gateway_payload')->nullable()->after('gateway_reference');
            $table->timestamp('expires_at')->nullable()->index()->after('gateway_payload');
            $table->timestamp('paid_at')->nullable()->after('expires_at');
            $table->timestamp('failed_at')->nullable()->after('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn(['method', 'idempotency_key', 'gateway_reference', 'gateway_payload', 'expires_at', 'paid_at', 'failed_at']);
        });
    }
};
