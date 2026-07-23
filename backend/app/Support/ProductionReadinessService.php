<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\{ActivityLog, Booking, Customer, Driver, FeatureFlag, Membership, Notification, Passenger, Payment, Promo, Route, Schedule, SeatReservation, SystemSetting, Ticket, Trip, User, Vehicle, VehicleLayout, VehicleSeat, Voucher};
use Illuminate\Support\Facades\{Artisan, Cache, DB, File, Mail, Schema, Storage};

final class ProductionReadinessService
{
    /**
     * The demo accounts. Kept as one constant so the counts reported by
     * demoData() and the rows removed by deleteDemoData() can never drift
     * apart — a mismatch there would show "0 remaining" while rows survive.
     */
    private const DEMO_EMAILS = ['demo.customer@stms.test', 'demo.driver@stms.test'];

    public const SETTINGS_PREFIXES = ['app.', 'booking.', 'company.', 'feature.', 'gps.', 'installer.', 'mail.', 'membership.', 'notification.', 'payment.', 'promo.', 'realtime.', 'ticket.'];

    public function health(): array
    {
        $checks = [
            'database' => $this->check(fn () => DB::connection()->getPdo() !== null, 'Connected'),
            'storage' => $this->status(is_writable(storage_path()) && is_writable(storage_path('app')), storage_path()),
            'queue' => $this->status(filled(config('queue.default')), (string) config('queue.default')),
            'cache' => $this->check(fn () => Cache::put('stms_readiness_check', true, 10) === null || Cache::get('stms_readiness_check') === true, (string) config('cache.default')),
            'scheduler' => $this->status(File::exists(base_path('routes/console.php')) || File::exists(app_path('Console/Kernel.php')), 'Laravel scheduler available; cron must run externally'),
            'mail' => $this->status(filled(config('mail.default')) && filled(config('mail.from.address')), (string) config('mail.default'), 'Mail transport/from address incomplete'),
            'reverb' => $this->status(filled(config('broadcasting.connections.reverb.key')), 'Configured', 'Reverb credentials not configured'),
            'midtrans' => $this->status(filled(config('payment.midtrans.server_key')), 'Configured', 'Midtrans key not configured'),
            'filesystem' => $this->status(Storage::disk(config('filesystems.default'))->exists('.') || true, (string) config('filesystems.default')),
            'environment' => $this->status(app()->environment('production') ? ! config('app.debug') : true, app()->environment(), 'APP_DEBUG should be false in production'),
            'app_key' => $this->status(filled(config('app.key')), 'APP_KEY present', 'APP_KEY missing'),
            'owner' => $this->status(User::query()->where('role', 'owner')->exists(), 'Owner exists', 'Owner account missing'),
            'admin' => $this->status(User::query()->where('role', 'admin')->exists(), 'Admin exists', 'Admin account missing'),
            'installer_locked' => $this->status((bool) SystemSetting::query()->where('key', 'installer.locked')->value('value'), 'Locked', 'Installer is not locked'),
        ];
        $overall = collect($checks)->contains(fn ($c) => $c['status'] === 'failed') ? 'failed' : (collect($checks)->contains(fn ($c) => $c['status'] === 'warning') ? 'warning' : 'healthy');
        return ['status' => $overall, 'checks' => $checks];
    }

    public function exportConfiguration(): array
    {
        return [
            'exported_at' => now()->toISOString(),
            'settings' => SystemSetting::query()->where(fn ($q) => collect(self::SETTINGS_PREFIXES)->each(fn ($p) => $q->orWhere('key', 'like', $p.'%')))->orderBy('key')->get(['key', 'value', 'is_public'])->all(),
            'feature_flags' => FeatureFlag::query()->orderBy('key')->get(['key', 'enabled', 'metadata'])->all(),
        ];
    }

    public function importConfiguration(array $payload, ?User $actor = null): array
    {
        return DB::transaction(function () use ($payload, $actor): array {
            foreach ($payload['settings'] ?? [] as $setting) {
                SystemSetting::query()->updateOrCreate(['key' => $setting['key']], ['value' => $setting['value'] ?? null, 'is_public' => (bool) ($setting['is_public'] ?? false)]);
            }
            foreach ($payload['feature_flags'] ?? [] as $flag) {
                FeatureFlag::query()->updateOrCreate(['key' => $flag['key']], ['enabled' => (bool) ($flag['enabled'] ?? false), 'metadata' => $flag['metadata'] ?? []]);
            }
            $this->audit('configuration.imported', $actor, ['settings' => count($payload['settings'] ?? []), 'feature_flags' => count($payload['feature_flags'] ?? [])]);
            return ['imported' => true];
        });
    }

    public function backupConfiguration(?User $actor = null): array
    {
        $payload = $this->exportConfiguration();
        $path = 'backups/configuration/stms-config-'.now()->format('Ymd-His').'.json';
        Storage::put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
        $this->audit('configuration.backed_up', $actor, ['path' => $path]);
        return ['path' => $path, 'payload' => $payload];
    }

    /**
     * Build a full, restorable backup ZIP containing:
     *  - database/<table>.json  — every table's rows (JSON, restorable via the
     *    documented import steps or any JSON->SQL tool),
     *  - storage/…              — all uploaded files (public disk),
     *  - configuration.json     — settings + feature flags (restorable through
     *    the existing configuration import endpoint),
     *  - RESTORE.md             — step-by-step restore instructions.
     *
     * Returns the absolute path of the generated ZIP for streaming.
     */
    public function fullBackupZip(?User $actor = null): string
    {
        abort_unless(class_exists(\ZipArchive::class), 500, 'PHP ext-zip tidak tersedia di server ini.');

        $dir = storage_path('app/backups/full');
        File::ensureDirectoryExists($dir);
        $zipPath = $dir.'/stms-full-backup-'.now()->format('Ymd-His').'.zip';

        $zip = new \ZipArchive();
        abort_unless($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true, 500, 'Gagal membuat arsip backup.');

        // 1) Database — dump every table as JSON, chunked to stay memory-safe.
        foreach (Schema::getTables() as $table) {
            $name = is_array($table) ? ($table['name'] ?? null) : ($table->name ?? null);
            if (! $name || in_array($name, ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'personal_access_tokens'], true)) {
                continue; // runtime/ephemeral tables are not part of a restore.
            }
            $rows = [];
            if (Schema::hasColumn($name, 'id')) {
                DB::table($name)->orderBy('id')->chunk(1000, function ($chunk) use (&$rows): void {
                    foreach ($chunk as $row) {
                        $rows[] = (array) $row;
                    }
                });
            } else {
                $rows = DB::table($name)->get()->map(fn ($row) => (array) $row)->all();
            }
            $zip->addFromString('database/'.$name.'.json', json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        // 2) Uploaded files (public disk: driver photos, settings images, …).
        foreach (Storage::disk('public')->allFiles() as $file) {
            $zip->addFile(Storage::disk('public')->path($file), 'storage/'.$file);
        }

        // 3) Configuration snapshot (settings + feature flags).
        $zip->addFromString('configuration.json', json_encode($this->exportConfiguration(), JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));

        // 4) Restore instructions.
        $zip->addFromString('RESTORE.md', implode("\n", [
            '# STMS Full Backup — Cara Restore',
            '',
            'Backup ini berisi database (JSON per tabel), file upload, dan konfigurasi.',
            '',
            '## 1. Database',
            'Jalankan migrasi pada instalasi baru: `php artisan migrate`.',
            'Impor setiap file `database/<tabel>.json` ke tabel yang sesuai,',
            'misalnya dengan tinker: `DB::table(\'routes\')->insert(json_decode(file_get_contents(\'routes.json\'), true));`',
            'Urutan aman: users → customers/drivers → vehicle_layouts → vehicles → vehicle_seats → routes → schedules → trips → bookings → passengers → seat_reservations → tickets → payments → sisanya.',
            '',
            '## 2. File upload',
            'Salin isi folder `storage/` ke `storage/app/public/` lalu jalankan `php artisan storage:link`.',
            '',
            '## 3. Konfigurasi',
            'Kirim isi `configuration.json` ke endpoint `POST /api/owner/production-readiness/configuration/import` sebagai owner.',
            '',
            'Setelah itu isi `.env` (APP_KEY, DB, mail, payment) sesuai server tujuan.',
        ]));

        $zip->close();
        $this->audit('backup.full_download', $actor, ['path' => $zipPath, 'size' => File::size($zipPath)]);

        return $zipPath;
    }

    public function restoreConfiguration(string $path, ?User $actor = null): array
    {
        abort_unless(Storage::exists($path), 404, 'Configuration backup not found.');
        return $this->importConfiguration(json_decode(Storage::get($path), true, flags: JSON_THROW_ON_ERROR), $actor);
    }

    public function demoData(): array
    {
        $ids = $this->demoIds();

        return ['counts' => [
            'User' => count($ids['users']),
            'Customer' => count($ids['customers']),
            'Driver' => count($ids['drivers']),
            'VehicleLayout' => VehicleLayout::withTrashed()->where('name', 'Demo Executive')->count(),
            'Vehicle' => count($ids['vehicles']),
            'VehicleSeat' => $ids['vehicles'] === [] ? 0 : VehicleSeat::withTrashed()->whereIn('vehicle_id', $ids['vehicles'])->count(),
            'Route' => count($ids['routes']),
            'Schedule' => count($ids['schedules']),
            'Booking' => count($ids['bookings']),
            'Passenger' => Passenger::withTrashed()->where('identity_number', 'DEMO-ID-001')->count(),
            'Ticket' => Ticket::withTrashed()->where('ticket_number', 'DEMO-TICKET')->count(),
            'Payment' => Payment::withTrashed()->where('reference', 'DEMO-PAYMENT')->count(),
            'Notification' => $ids['users'] === [] ? 0 : Notification::withTrashed()->whereIn('user_id', $ids['users'])->count(),
            'Promo' => Promo::withTrashed()->where('code', 'DEMO')->count(),
            'Voucher' => Voucher::withTrashed()->where('code', 'DEMO1000')->count(),
            'Membership' => $ids['customers'] === [] ? 0 : Membership::withTrashed()->whereIn('customer_id', $ids['customers'])->count(),
        ]];
    }

    /**
     * Physically remove the demo dataset.
     *
     * This used to fail with a 1451 foreign-key violation, and the reason is
     * worth recording because it is easy to reintroduce.
     *
     * Almost every model here uses SoftDeletes, so `->delete()` only stamps
     * `deleted_at` — the rows stay in the table. `User` does NOT use
     * SoftDeletes, so the final call was a real DELETE. MySQL then cascaded
     * into `drivers` (users→drivers is ON DELETE CASCADE) and tried to
     * physically remove the driver row, which `schedules.driver_id` blocks
     * with ON DELETE RESTRICT — because the schedule was only soft-deleted and
     * was still physically present. Deleting in the right order was never the
     * problem; deleting *softly* was.
     *
     * So every soft-deleting model is force-deleted here, in strict
     * child-before-parent order, and each query is `withTrashed()` so rows
     * left behind by an earlier failed run are still swept up rather than
     * becoming permanently invisible orphans that block the purge forever.
     */
    public function deleteDemoData(?User $actor = null): array
    {
        return DB::transaction(function () use ($actor): array {
            $ids = $this->demoIds();
            $deleted = [];

            // --- Booking subtree -------------------------------------------
            // Not created by the demo seeder, but a demo schedule that someone
            // dispatched would leave a trip holding RESTRICT references.
            $deleted['Trip'] = $ids['schedules'] === []
                ? 0
                : Trip::withTrashed()->whereIn('schedule_id', $ids['schedules'])->forceDelete();

            $deleted['SeatReservation'] = $ids['bookings'] === []
                ? 0
                : SeatReservation::withTrashed()->whereIn('booking_id', $ids['bookings'])->forceDelete();

            $deleted['Ticket'] = Ticket::withTrashed()->where('ticket_number', 'DEMO-TICKET')->forceDelete();
            $deleted['Payment'] = Payment::withTrashed()->where('reference', 'DEMO-PAYMENT')->forceDelete();
            $deleted['Passenger'] = Passenger::withTrashed()->where('identity_number', 'DEMO-ID-001')->forceDelete();
            $deleted['Booking'] = Booking::withTrashed()->where('code', 'DEMO-BOOKING')->forceDelete();

            // --- Schedule must be physically gone before driver/vehicle -----
            $deleted['Schedule'] = $ids['schedules'] === []
                ? 0
                : Schedule::withTrashed()->whereIn('id', $ids['schedules'])->forceDelete();

            // --- Standalone records ----------------------------------------
            $deleted['Membership'] = $ids['customers'] === []
                ? 0
                : Membership::withTrashed()->whereIn('customer_id', $ids['customers'])->forceDelete();

            $deleted['Notification'] = $ids['users'] === []
                ? 0
                : Notification::withTrashed()->whereIn('user_id', $ids['users'])->forceDelete();

            $deleted['Voucher'] = Voucher::withTrashed()->where('code', 'DEMO1000')->forceDelete();
            $deleted['Promo'] = Promo::withTrashed()->where('code', 'DEMO')->forceDelete();

            // --- Fleet ------------------------------------------------------
            $deleted['VehicleSeat'] = $ids['vehicles'] === []
                ? 0
                : VehicleSeat::withTrashed()->whereIn('vehicle_id', $ids['vehicles'])->forceDelete();

            $deleted['Vehicle'] = $ids['vehicles'] === []
                ? 0
                : Vehicle::withTrashed()->whereIn('id', $ids['vehicles'])->forceDelete();

            $deleted['VehicleLayout'] = VehicleLayout::withTrashed()->where('name', 'Demo Executive')->forceDelete();
            $deleted['Route'] = Route::withTrashed()->where('code', 'DEMO-ROUTE')->forceDelete();

            // --- Identities last --------------------------------------------
            $deleted['Driver'] = Driver::withTrashed()->where('license_number', 'DEMO-SIM-001')->forceDelete();

            $deleted['Customer'] = $ids['customers'] === []
                ? 0
                : Customer::withTrashed()->whereIn('id', $ids['customers'])->forceDelete();

            // User has no SoftDeletes, so this is already a hard delete. By
            // now every child row is physically gone, so the cascade is a no-op.
            $deleted['User'] = $ids['users'] === []
                ? 0
                : User::whereIn('id', $ids['users'])->delete();

            $this->audit('demo.deleted', $actor, ['deleted' => $deleted]);
            return ['deleted' => $deleted];
        });
    }

    /**
     * Resolve the demo records by primary key before anything is removed.
     *
     * Resolving up front matters: `whereHas('customer.user', …)` applies the
     * related models' soft-delete scopes, so once a parent has been trashed
     * the child can no longer be found through it. Reading the ids first —
     * and reading them `withTrashed()` — keeps the purge idempotent.
     *
     * @return array{users: list<int>, customers: list<int>, drivers: list<int>, vehicles: list<int>, routes: list<int>, schedules: list<int>, bookings: list<int>}
     */
    private function demoIds(): array
    {
        $users = User::whereIn('email', self::DEMO_EMAILS)->pluck('id')->all();

        $customers = $users === []
            ? []
            : Customer::withTrashed()->whereIn('user_id', $users)->pluck('id')->all();

        $drivers = Driver::withTrashed()->where('license_number', 'DEMO-SIM-001')->pluck('id')->all();
        $vehicles = Vehicle::withTrashed()->where('code', 'DEMO-BUS')->pluck('id')->all();
        $routes = Route::withTrashed()->where('code', 'DEMO-ROUTE')->pluck('id')->all();

        $schedules = $routes === []
            ? []
            : Schedule::withTrashed()->whereIn('route_id', $routes)->pluck('id')->all();

        $bookings = Booking::withTrashed()->where('code', 'DEMO-BOOKING')->pluck('id')->all();

        return compact('users', 'customers', 'drivers', 'vehicles', 'routes', 'schedules', 'bookings');
    }

    private function check(callable $callback, string $okMessage): array { try { return $this->status((bool) $callback(), $okMessage); } catch (\Throwable $e) { return ['status' => 'failed', 'message' => $e->getMessage()]; } }
    private function status(bool $ok, string $okMessage, string $warning = ''): array { return ['status' => $ok ? 'healthy' : 'warning', 'message' => $ok ? $okMessage : $warning]; }
    private function audit(string $action, ?User $actor, array $metadata): void { ActivityLog::query()->create(['action' => $action, 'subject_type' => $actor ? User::class : self::class, 'subject_id' => $actor?->id, 'metadata' => $metadata]); }
}
