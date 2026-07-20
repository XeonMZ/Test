<?php

declare(strict_types=1);

namespace App\Support\Mail;

use App\Jobs\SendTransactionalEmail;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The single entry point for every transactional email (verification, reset,
 * invoices, lifecycle notices).
 *
 *  - Duplicate + race prevention: `insertOrIgnore` on the UNIQUE dedupe_key —
 *    two concurrent triggers can never enqueue the same email twice.
 *  - Never blocks the request: only an insert + queue dispatch happen inline;
 *    rendering and SMTP/Resend I/O run in the queued job.
 *  - Full audit: every transaction has an email_logs row whose status the job
 *    keeps updated (queued → sent | failed, with attempts + error).
 */
final class TransactionalMailer
{
    /** @param array<string, mixed> $metadata Returns false when deduplicated. */
    public function queue(string $type, string $toEmail, string $subject, Mailable $mailable, string $dedupeKey, ?int $userId = null, array $metadata = []): bool
    {
        $uuid = (string) Str::uuid();
        $inserted = DB::table('email_logs')->insertOrIgnore([
            'uuid' => $uuid,
            'dedupe_key' => $type.':'.$dedupeKey,
            'type' => $type,
            'user_id' => $userId,
            'to_email' => $toEmail,
            'subject' => $subject,
            'status' => 'queued',
            'metadata' => $metadata === [] ? null : json_encode($metadata),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($inserted === 0) {
            return false; // already queued/sent for this dedupe key
        }

        SendTransactionalEmail::dispatch($uuid, $toEmail, $mailable);
        return true;
    }
}
