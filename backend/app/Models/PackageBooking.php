<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class PackageBooking extends Model
{
    use SoftDeletes;

    public const ACTIVE_STATUSES = ['waiting_payment', 'waiting_verification', 'paid'];

    protected $guarded = ['id'];
    protected $casts = ['travel_date' => 'date', 'paid_at' => 'datetime', 'amount' => 'float', 'payment_payload' => 'array', 'payment_expires_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(function (self $m): void {
            $m->uuid ??= (string) Str::uuid();
            $m->code ??= 'PKG-'.strtoupper(Str::random(6));
        });
    }

    public function tourPackage(): BelongsTo { return $this->belongsTo(TourPackage::class); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }
}
