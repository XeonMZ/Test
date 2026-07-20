<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class CmsSection extends Model
{
    use SoftDeletes;

    public const TYPES = ['hero', 'banner', 'about', 'service', 'services', 'stats', 'promo', 'testimonial', 'gallery', 'faq', 'contact', 'footer', 'seo'];

    protected $guarded = ['id'];
    protected $casts = ['metadata' => 'array', 'is_active' => 'bool', 'publish_start' => 'datetime', 'publish_end' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn (self $m) => $m->uuid ??= (string) Str::uuid());
    }

    /** Active AND inside its publish window (if any). */
    public function scopePublished(Builder $q): Builder
    {
        return $q->where('is_active', true)
            ->where(fn ($x) => $x->whereNull('publish_start')->orWhere('publish_start', '<=', now()))
            ->where(fn ($x) => $x->whereNull('publish_end')->orWhere('publish_end', '>=', now()));
    }
}
