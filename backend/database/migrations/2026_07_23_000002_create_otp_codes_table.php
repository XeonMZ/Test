<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One-time passcodes for email verification and password reset.
 *
 * Security properties this schema is built to guarantee:
 *
 *  - The passcode itself is NEVER stored. `code_hash` holds an HMAC-SHA256
 *    keyed with the application secret and bound to email+purpose, so a stolen
 *    database alone cannot be brute-forced offline (the 6-digit keyspace is
 *    only 10^6 — plain SHA-256 would fall in milliseconds) and a code minted
 *    for one purpose can never be replayed against another.
 *  - `attempts` bounds online guessing per code; the service burns the code
 *    once the ceiling is hit, so an attacker gets a handful of tries, not 10^6.
 *  - `consumed_at` makes every code strictly single-use — replay is dead even
 *    inside the validity window.
 *  - `request_ip` / `user_agent` give operations a forensic trail for abuse
 *    investigations without storing anything secret.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Always stored lowercased/trimmed by OtpService so lookups are exact.
            $table->string('email');
            $table->string('purpose', 32);

            // 64-char hex HMAC-SHA256. Never the passcode itself.
            $table->string('code_hash', 64);

            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();

            $table->string('request_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();

            $table->timestamps();

            // Hot path: "newest live code for this email + purpose".
            $table->index(['email', 'purpose', 'consumed_at']);
            // Housekeeping: pruning expired rows.
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
