<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer ratings for tour packages.
 *
 * The integrity rule lives in the schema, not just in the controller: the
 * unique key is on `package_booking_id`, so one purchase buys exactly one
 * rating. That is deliberately not `unique(package, customer)` — a customer
 * who genuinely books the same package twice has earned two opinions — and it
 * is what stops a single account from inflating a package's score by posting
 * repeatedly. A controller check alone would leave the door open to a race
 * between two concurrent submissions.
 *
 * Deleting a booking removes its rating: a score with no purchase behind it is
 * exactly the thing this table exists to prevent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_ratings', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->foreignId('tour_package_id')->constrained('tour_packages')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('package_booking_id')->constrained('package_bookings')->cascadeOnDelete();

            $table->unsignedTinyInteger('stars');   // 1..5, enforced by the request rules
            $table->text('comment')->nullable();

            $table->timestamps();

            // One rating per purchase — see the class docblock.
            $table->unique('package_booking_id');
            // Hot path: the rating summary and review list for one package.
            $table->index(['tour_package_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_ratings');
    }
};
