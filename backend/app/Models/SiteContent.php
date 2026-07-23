<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Structured, editable site content. See the migration for why this lives
 * apart from legal_documents and cms_sections.
 */
final class SiteContent extends Model
{
    /** Canonical slugs — mirrored by the frontend loaders. */
    public const SLUGS = ['company-profile'];

    protected $guarded = ['id'];

    protected $casts = ['payload' => 'array'];

    protected static function booted(): void
    {
        static::creating(fn (self $m) => $m->uuid ??= (string) Str::uuid());
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
