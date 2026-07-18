<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Notification Center redesign: one `notification_activities` row per send
 * activity (broadcast / personal / draft); `notifications` rows become the
 * per-recipient records (notification -> recipients relation). Existing
 * broadcasts (tagged with metadata.broadcast_id) are backfilled into
 * activities so history is preserved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_activities', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('kind')->default('broadcast')->index(); // broadcast | personal
            $table->string('target_role')->nullable()->index();    // all | customer | driver | admin | owner (broadcast)
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete(); // personal
            $table->string('type')->default('broadcast');          // notification type shown in inbox
            $table->string('title');
            $table->text('body');
            $table->string('status')->default('draft')->index();   // draft | sent | failed
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamp('sent_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::table('notifications', function (Blueprint $table): void {
            $table->foreignId('notification_activity_id')->nullable()->after('user_id')->constrained('notification_activities')->nullOnDelete();
        });

        // ---- Backfill: turn each historical broadcast into one activity ----
        $groups = DB::table('notifications')
            ->whereNotNull('metadata->broadcast_id')
            ->selectRaw("min(id) as first_id, count(*) as total, min(created_at) as sent_at")
            ->groupBy(DB::raw("json_unquote(json_extract(metadata, '$.broadcast_id'))"))
            ->get();

        foreach ($groups as $group) {
            $sample = DB::table('notifications')->where('id', $group->first_id)->first();
            if (! $sample) {
                continue;
            }
            $meta = json_decode((string) $sample->metadata, true) ?: [];
            $broadcastId = $meta['broadcast_id'] ?? null;
            if (! $broadcastId) {
                continue;
            }
            $activityId = DB::table('notification_activities')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'sender_id' => $meta['broadcast_by'] ?? null,
                'kind' => 'broadcast',
                'target_role' => 'all', // exact historical target was not stored per-row
                'type' => $sample->type ?? 'broadcast',
                'title' => $sample->title,
                'body' => $sample->body,
                'status' => 'sent',
                'sent_count' => (int) $group->total,
                'sent_at' => $group->sent_at,
                'created_at' => $group->sent_at,
                'updated_at' => $group->sent_at,
            ]);
            DB::table('notifications')
                ->where('metadata->broadcast_id', $broadcastId)
                ->update(['notification_activity_id' => $activityId]);
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('notification_activity_id');
        });
        Schema::dropIfExists('notification_activities');
    }
};
