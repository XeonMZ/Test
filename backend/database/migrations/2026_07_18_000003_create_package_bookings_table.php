<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Package bookings — end-to-end flow for Tour Package CMS.
 * Pax-based (not seat-based), lifecycle:
 * waiting_payment → waiting_verification → paid → completed | cancelled.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_bookings', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code')->unique();
            $table->foreignId('tour_package_id')->constrained('tour_packages')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->date('travel_date')->index();
            $table->unsignedSmallInteger('pax');
            $table->decimal('amount', 12, 2);
            $table->string('status', 32)->default('waiting_payment')->index();
            $table->string('contact_phone', 30)->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['tour_package_id', 'travel_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_bookings');
    }
};
