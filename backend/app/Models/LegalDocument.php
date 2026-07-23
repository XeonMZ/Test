<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

final class LegalDocument extends Model
{
    /** Canonical slugs — mirrored by the frontend routes. */
    public const SLUGS = [
        'privacy-policy',
        'terms-and-conditions',
        'refund-policy',
        'contact',
        'copyright',
    ];

    protected $guarded = ['id'];

    protected $casts = ['is_published' => 'bool'];

    protected static function booted(): void
    {
        static::creating(fn (self $m) => $m->uuid ??= (string) Str::uuid());
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('is_published', true);
    }
}
