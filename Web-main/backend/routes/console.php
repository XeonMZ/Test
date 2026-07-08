<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('booking:release-expired-seats')->everyMinute()->timezone('Asia/Jakarta');
Schedule::command('booking:expire-due')->everyMinute()->timezone('Asia/Jakarta');
Schedule::command('booking:cleanup-drafts')->everyMinute()->timezone('Asia/Jakarta');
Schedule::command('queue:prune-batches --hours=48')->daily();
Schedule::command('model:prune')->dailyAt('02:00')->timezone('Asia/Jakarta');
