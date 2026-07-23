<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\FeatureFlag;
use App\Models\Membership;
use App\Models\PricingRule;
use App\Models\Promo;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleLayout;
use App\Models\VehicleSeat;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Idempotent seeder — safe to run on EVERY deploy.
 *
 * Every record is matched on a unique key via firstOrCreate/updateOrCreate,
 * so re-running never duplicates rows and never crashes on unique
 * constraints (e.g. the demo account emails). Passwords are only set on
 * first creation so a re-seed won't reset a password an operator changed.
 */
final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Demo accounts (matched by unique email) ---
        $admin = User::firstOrCreate(
            ['email' => 'admin@stms.test'],
            ['name' => 'Admin SJT', 'password' => Hash::make('password'), 'role' => 'admin'],
        );
        $owner = User::firstOrCreate(
            ['email' => 'owner@stms.test'],
            ['name' => 'Owner SJT', 'password' => Hash::make('password'), 'role' => 'owner'],
        );
        $customerUser = User::firstOrCreate(
            ['email' => 'customer@stms.test'],
            ['name' => 'Sample Customer', 'password' => Hash::make('password'), 'role' => 'customer'],
        );
        $driverUser = User::firstOrCreate(
            ['email' => 'driver@stms.test'],
            ['name' => 'Sample Driver', 'password' => Hash::make('password'), 'role' => 'driver'],
        );

        // Keep roles correct even if a row somehow predates this seeder.
        $admin->forceFill(['role' => 'admin'])->save();
        $owner->forceFill(['role' => 'owner'])->save();

        // --- Profiles (matched by user_id) ---
        $customer = Customer::firstOrCreate(
            ['user_id' => $customerUser->id],
            ['phone' => '6281234567890'],
        );
        $driver = Driver::firstOrCreate(
            ['user_id' => $driverUser->id],
            ['license_number' => 'SIM-A-0001', 'status' => 'available'],
        );

        // --- Fleet (matched by unique code) ---
        $layout = VehicleLayout::firstOrCreate(
            ['name' => 'Executive 2-2'],
            ['capacity' => 12, 'metadata' => ['rows' => 3]],
        );
        $vehicle = Vehicle::firstOrCreate(
            ['code' => 'BUS-001'],
            ['vehicle_layout_id' => $layout->id, 'plate_number' => 'B 1234 SJT', 'brand' => 'Mercedes', 'status' => 'active'],
        );

        // Seats (matched by vehicle_id + seat_number — composite unique).
        foreach (range(1, 12) as $seat) {
            VehicleSeat::firstOrCreate(
                ['vehicle_id' => $vehicle->id, 'seat_number' => 'A'.$seat],
                ['class' => 'regular', 'is_active' => true],
            );
        }

        // --- Route + schedule + pricing (matched by unique keys) ---
        $route = Route::firstOrCreate(
            ['code' => 'JKT-BDG'],
            ['origin' => 'Jakarta', 'destination' => 'Bandung', 'distance_km' => 150, 'duration_minutes' => 180],
        );

        // Only create a demo schedule if this route has none yet, so we don't
        // pile up a new future departure on every deploy.
        if (! Schedule::where('route_id', $route->id)->exists()) {
            Schedule::create([
                'route_id' => $route->id,
                'driver_id' => $driver->id,
                'vehicle_id' => $vehicle->id,
                'departure_at' => now()->addDay(),
                'arrival_at' => now()->addDay()->addHours(3),
                'base_fare' => 150000,
                'status' => 'scheduled',
            ]);
        }

        PricingRule::firstOrCreate(
            ['route_id' => $route->id, 'name' => 'Base weekday'],
            ['amount' => 150000, 'metadata' => ['type' => 'base']],
        );

        // --- System config & flags (already idempotent) ---
        SystemSetting::updateOrCreate(['key' => 'timezone'], ['uuid' => (string) Str::uuid(), 'value' => 'Asia/Jakarta', 'is_public' => true]);
        SystemSetting::updateOrCreate(['key' => 'booking.seat_lock_minutes'], ['uuid' => (string) Str::uuid(), 'value' => 10, 'is_public' => false]);
        FeatureFlag::updateOrCreate(['key' => 'booking_enabled'], ['uuid' => (string) Str::uuid(), 'enabled' => true, 'metadata' => []]);

        // Contact & social defaults so the footer / CS buttons render out of the box.
        foreach ([
            'cs_whatsapp' => '6281234567890',
            'jastip_whatsapp' => '6281234567890',
            'social_instagram' => 'https://instagram.com/',
            'social_tiktok' => 'https://tiktok.com/',
            'social_facebook' => 'https://facebook.com/',
            'welcome_notice' => 'Selamat datang di SJT Travel & Tour.',
            // Company profile rendered on the public Contact page.
            'company_address' => 'Semarang, Jawa Tengah, Indonesia',
            'company_email' => 'info@sjttravel.id',
            'company_phone' => '+62 812-0000-0000',
            'company_hours' => 'Senin - Minggu, 07.00 - 21.00 WIB',
            'company_maps_embed' => null,
        ] as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['uuid' => (string) Str::uuid(), 'value' => $value, 'is_public' => true]);
        }

        // --- Membership, promo, voucher (matched by unique keys) ---
        Membership::firstOrCreate(
            ['customer_id' => $customer->id],
            ['level' => 'silver', 'points' => 100],
        );
        $promo = Promo::firstOrCreate(
            ['code' => 'WELCOME'],
            ['name' => 'Welcome Promo', 'amount' => 25000, 'starts_at' => now(), 'ends_at' => now()->addMonth()],
        );
        Voucher::firstOrCreate(
            ['code' => 'WELCOME25'],
            ['promo_id' => $promo->id, 'is_active' => true],
        );

        // --- Legal pages (privacy, terms, refund, contact, copyright) ---
        $this->call(LegalDocumentSeeder::class);
    }
}
