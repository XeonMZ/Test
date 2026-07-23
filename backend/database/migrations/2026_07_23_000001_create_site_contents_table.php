<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Editable site content blocks (company profile, and any future structured
 * marketing copy).
 *
 * Separate from `legal_documents` (which stores long prose under a public
 * legal slug) and from `cms_sections` (Page Builder blocks that get wiped on
 * version restore). Content here is *structured* — lists of services, mission
 * points, service areas — so it is stored as JSON and rendered by typed React
 * components rather than as free text.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_contents', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('slug', 64)->unique();   // company-profile
            $table->json('payload');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_contents');
    }
};
