<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_webhook_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('gateway_reference')->unique();
            $table->string('event_type');
            $table->json('payload');
            $table->timestamp('processed_at');
            $table->timestamps();
        });

        Schema::create('ticket_qr_codes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('ticket_uuid')->unique();
            $table->uuid('booking_uuid');
            $table->uuid('trip_uuid');
            $table->uuid('passenger_uuid');
            $table->string('ticket_number')->unique();
            $table->string('qr_path');
            $table->string('digital_signature');
            $table->timestamp('generated_at');
            $table->timestamps();
        });

        Schema::create('passenger_check_ins', function (Blueprint $table): void {
            $table->id();
            $table->uuid('ticket_uuid');
            $table->uuid('driver_uuid');
            $table->string('status');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->unique(['ticket_uuid', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passenger_check_ins');
        Schema::dropIfExists('ticket_qr_codes');
        Schema::dropIfExists('payment_webhook_logs');
    }
};
