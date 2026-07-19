<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

if ((bool) config('stms.scheduler_enabled', false)) {
    Schedule::command('booking:release-expired-seats')->everyMinute()->timezone('Asia/Jakarta');
    Schedule::command('booking:expire-due')->everyMinute()->timezone('Asia/Jakarta');
    Schedule::command('payment:expire-due')->everyMinute()->timezone('Asia/Jakarta');
    Schedule::command('booking:cleanup-drafts')->everyMinute()->timezone('Asia/Jakarta');
    Schedule::command('queue:prune-batches --hours=48')->daily();
    Schedule::command('model:prune')->dailyAt('02:00')->timezone('Asia/Jakarta');

    // DP settlement reminders — hourly; idempotent per booking per day.
    Schedule::command('payment:dp-settlement-reminders')->hourly();

    // Live Trip Tracking: GPS pings are only needed for the running trip's
    // polyline; prune history older than 7 days so driver_locations cannot
    // grow unbounded (~720k rows/day at 100 active drivers). Chunked deletes
    // keep the lock window small.
    Schedule::call(function (): void {
        do {
            $deleted = \Illuminate\Support\Facades\DB::table('driver_locations')
                ->where('recorded_at', '<', now()->subDays(7))
                ->limit(5000)
                ->delete();
        } while ($deleted > 0);
    })->name('gps:prune-driver-locations')->dailyAt('02:30')->timezone('Asia/Jakarta');
}
