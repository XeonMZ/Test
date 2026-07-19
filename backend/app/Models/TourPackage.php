<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class TourPackage extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];
    protected $casts = ['facilities' => 'array', 'itinerary' => 'array', 'gallery' => 'array', 'is_featured' => 'bool', 'is_recommended' => 'bool', 'is_best_seller' => 'bool', 'is_promo' => 'bool', 'price' => 'float'];

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            $model->uuid ??= (string) Str::uuid();
            $model->slug = $model->slug ?: Str::slug($model->name).'-'.Str::lower(Str::random(5));
        });
    }
}
