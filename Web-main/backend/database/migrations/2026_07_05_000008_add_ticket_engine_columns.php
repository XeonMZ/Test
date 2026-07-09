<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->foreignId('passenger_id')->nullable()->after('booking_id')->constrained()->nullOnDelete();
            $table->foreignId('trip_id')->nullable()->after('passenger_id')->constrained()->nullOnDelete();
            $table->string('verification_token')->nullable()->unique()->after('qr_code');
            $table->string('qr_path')->nullable()->after('verification_token');
            $table->string('digital_signature')->nullable()->after('qr_path');
            $table->timestamp('sent_at')->nullable()->after('digital_signature');
            $table->timestamp('checked_in_at')->nullable()->after('sent_at');
            $table->timestamp('boarded_at')->nullable()->after('checked_in_at');
            $table->timestamp('completed_at')->nullable()->after('boarded_at');
            $table->timestamp('expires_at')->nullable()->index()->after('completed_at');
            $table->json('metadata')->nullable()->after('expires_at');
            $table->index(['trip_id', 'status']);
        });
        Schema::table('passenger_check_ins', function (Blueprint $table): void {
            $table->string('verification_token')->nullable()->after('ticket_uuid');
            $table->json('metadata')->nullable()->after('recorded_at');
            $table->index(['driver_uuid', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::table('passenger_check_ins', function (Blueprint $table): void {
            $table->dropIndex(['driver_uuid', 'recorded_at']);
            $table->dropColumn(['verification_token', 'metadata']);
        });
        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropIndex(['trip_id', 'status']);
            $table->dropConstrainedForeignId('passenger_id');
            $table->dropConstrainedForeignId('trip_id');
            $table->dropColumn(['verification_token', 'qr_path', 'digital_signature', 'sent_at', 'checked_in_at', 'boarded_at', 'completed_at', 'expires_at', 'metadata']);
        });
    }
};
