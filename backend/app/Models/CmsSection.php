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

    public const TYPES = ['hero', 'banner', 'about', 'service', 'services', 'stats', 'promo', 'testimonial', 'gallery', 'faq', 'contact', 'footer', 'seo', 'recommendation', 'hero_slider'];

    /** Cards in the swipeable recommendation rail on the customer dashboard. */
    public const TYPE_RECOMMENDATION = 'recommendation';

    /**
     * One slide of the swipeable hero banner.
     *
     * Each row is a single slide — image, headline, sub-text, link — and the
     * renderer groups every published row of this type into one carousel,
     * ordered by sort_order. Storing slides as rows rather than as a JSON
     * array inside one section is what lets the existing generic CMS form
     * edit, reorder and schedule them individually.
     *
     * This is additive: the original `hero` block is untouched and both can
     * appear on the same page.
     */
    public const TYPE_HERO_SLIDER = 'hero_slider';

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
