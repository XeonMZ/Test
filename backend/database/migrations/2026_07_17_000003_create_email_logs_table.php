<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Resend email integration:
 *  - email_logs: one row per transactional email. The UNIQUE dedupe_key is the
 *    atomic duplicate-send / race-condition guard (insertOrIgnore) and the
 *    audit record (status, error, attempts, timestamps).
 *  - Backfill: existing users are grandfathered as verified so enabling
 *    EMAIL_VERIFICATION_REQUIRED can never lock out current accounts.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('dedupe_key')->unique();
            $table->string('type')->index();            // verify_email | reset_password | payment_success | payment_failed | booking_cancelled | payment_refunded
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('to_email');
            $table->string('subject');
            $table->string('status')->default('queued')->index(); // queued | sent | failed
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('error')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['type', 'created_at']);
        });

        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
