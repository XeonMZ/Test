<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tour Package CMS + Home/Content CMS.
 * cms_sections is one flexible table covering every home-page block type
 * (hero, service, promo, testimonial, gallery, faq, contact, footer, seo)
 * with display order, active flag, and publish scheduling — minimal schema,
 * maximal reuse.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tour_packages', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('destination')->nullable();
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->json('facilities')->nullable();   // ["Hotel", "Makan 3x", ...]
            $table->json('itinerary')->nullable();    // [{"day":1,"title":..,"detail":..}]
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedSmallInteger('capacity')->default(0);
            $table->string('cover_path')->nullable();
            $table->json('gallery')->nullable();      // [path, path]
            $table->string('status', 16)->default('active')->index(); // active|inactive
            $table->string('badge', 32)->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->boolean('is_recommended')->default(false)->index();
            $table->boolean('is_best_seller')->default(false)->index();
            $table->boolean('is_promo')->default(false)->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cms_sections', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('section_type', 32)->index(); // hero|service|promo|testimonial|gallery|faq|contact|footer|seo
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->string('image_path')->nullable();
            $table->string('link')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('publish_start')->nullable();
            $table->timestamp('publish_end')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['section_type', 'is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_sections');
        Schema::dropIfExists('tour_packages');
    }
};
