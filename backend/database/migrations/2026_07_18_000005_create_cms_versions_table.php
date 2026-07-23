<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CMS version history + draft/publish for the centralized CMS.
 * Each save snapshots the full section set as JSON so admins can review and
 * restore previous versions. Draft vs published is a flag on the snapshot;
 * the public site reads the latest *published* snapshot (fallback: live
 * cms_sections) so editing a draft never affects the live site until publish.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_versions', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('label')->nullable();
            $table->string('status', 16)->default('draft')->index(); // draft | published
            $table->json('snapshot'); // full sections + settings payload
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_versions');
    }
};
