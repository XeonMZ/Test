<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Legal documents (privacy policy, terms, refund policy, contact, copyright).
 *
 * Kept in a dedicated table rather than cms_sections because legal pages need
 * a stable public slug, a body far longer than the 8k section limit, per-page
 * SEO metadata, and an authoritative "last updated" timestamp that drives the
 * public "Terakhir diperbarui" label. Editing a row bumps updated_at
 * automatically, so the date on the site is always truthful.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_documents', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('slug', 64)->unique();           // privacy-policy, terms-and-conditions, ...
            $table->string('title', 200);
            $table->string('meta_description', 300)->nullable();
            $table->longText('body');                        // markdown-lite (## / - / paragraphs)
            $table->boolean('is_published')->default(true)->index();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_documents');
    }
};
