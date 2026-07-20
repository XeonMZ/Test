<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Batch migration for the customer/driver experience upgrade:
 *  - Driver profile fields (phone, photo, vehicle info) filled by admin/owner.
 *  - Driver ratings (stars + comment) visible to admin/owner.
 *  - Booking pickup/drop coordinates (maps) + direction (berangkat/pulang).
 *  - Promo redemption tracking on bookings.
 *  - Jastip (package delivery) records.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table): void {
            foreach ([
                'phone' => fn () => $table->string('phone', 32)->nullable(),
                'photo_path' => fn () => $table->string('photo_path')->nullable(),
                'vehicle_name' => fn () => $table->string('vehicle_name')->nullable(),
                'vehicle_plate' => fn () => $table->string('vehicle_plate', 32)->nullable(),
                'rating_avg' => fn () => $table->decimal('rating_avg', 3, 2)->default(0),
                'rating_count' => fn () => $table->unsignedInteger('rating_count')->default(0),
            ] as $col => $add) {
                if (! Schema::hasColumn('drivers', $col)) {
                    $add();
                }
            }
        });

        if (! Schema::hasTable('driver_ratings')) {
            Schema::create('driver_ratings', function (Blueprint $table): void {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
                $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedTinyInteger('stars'); // 1..5
                $table->text('comment')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('bookings', function (Blueprint $table): void {
            foreach ([
                'pickup_label' => fn () => $table->string('pickup_label')->nullable(),
                'pickup_lat' => fn () => $table->decimal('pickup_lat', 10, 7)->nullable(),
                'pickup_lng' => fn () => $table->decimal('pickup_lng', 10, 7)->nullable(),
                'drop_label' => fn () => $table->string('drop_label')->nullable(),
                'drop_lat' => fn () => $table->decimal('drop_lat', 10, 7)->nullable(),
                'drop_lng' => fn () => $table->decimal('drop_lng', 10, 7)->nullable(),
                'direction' => fn () => $table->string('direction', 16)->nullable(), // berangkat|pulang
                'promo_code' => fn () => $table->string('promo_code', 40)->nullable(),
                'discount_amount' => fn () => $table->decimal('discount_amount', 12, 2)->default(0),
            ] as $col => $add) {
                if (! Schema::hasColumn('bookings', $col)) {
                    $add();
                }
            }
        });

        if (! Schema::hasTable('jastip_orders')) {
            Schema::create('jastip_orders', function (Blueprint $table): void {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->string('code')->unique();
                $table->foreignId('driver_id')->nullable()->constrained()->nullOnDelete();
                $table->string('item_name');
                $table->text('description')->nullable();
                $table->string('sender_name')->nullable();
                $table->string('receiver_name')->nullable();
                $table->string('pickup_label')->nullable();
                $table->decimal('pickup_lat', 10, 7)->nullable();
                $table->decimal('pickup_lng', 10, 7)->nullable();
                $table->string('drop_label')->nullable();
                $table->decimal('drop_lat', 10, 7)->nullable();
                $table->decimal('drop_lng', 10, 7)->nullable();
                $table->string('status')->default('pending')->index(); // pending|assigned|picked_up|delivered|cancelled
                $table->decimal('fee', 12, 2)->default(0);
                $table->json('metadata')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('jastip_orders');
        Schema::dropIfExists('driver_ratings');
        Schema::table('bookings', function (Blueprint $table): void {
            foreach (['pickup_label', 'pickup_lat', 'pickup_lng', 'drop_label', 'drop_lat', 'drop_lng', 'direction', 'promo_code', 'discount_amount'] as $col) {
                if (Schema::hasColumn('bookings', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
        Schema::table('drivers', function (Blueprint $table): void {
            foreach (['phone', 'photo_path', 'vehicle_name', 'vehicle_plate', 'rating_avg', 'rating_count'] as $col) {
                if (Schema::hasColumn('drivers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
