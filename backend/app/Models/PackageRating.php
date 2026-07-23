<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/** A customer's rating of a tour package they actually travelled on. */
final class PackageRating extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['stars' => 'integer'];

    protected static function booted(): void
    {
        static::creating(fn (self $m) => $m->uuid ??= (string) Str::uuid());
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(TourPackage::class, 'tour_package_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(PackageBooking::class, 'package_booking_id');
    }
}
