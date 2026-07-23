<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class Schedule extends Model
{
    use HasFactory, HasUuid, SoftDeletes;

    protected $guarded = ['id'];
    protected $hidden = ['deleted_at'];
    protected $casts = ['metadata'=>'array','settings'=>'array','value'=>'array','starts_at'=>'datetime','ends_at'=>'datetime','departure_at'=>'datetime','arrival_at'=>'datetime','is_active'=>'boolean','enabled'=>'boolean','amount'=>'decimal:2','base_fare'=>'decimal:2'];

    public function route(): BelongsTo { return $this->belongsTo(Route::class); }

    public function driver(): BelongsTo { return $this->belongsTo(Driver::class); }

    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }

    public function bookings(): HasMany { return $this->hasMany(Booking::class); }

    public function trip(): HasOne { return $this->hasOne(Trip::class); }

    /** A schedule can be dispatched more than once (retry, driver swap). */
    public function trips(): HasMany { return $this->hasMany(Trip::class); }

    /**
     * The most recent dispatch.
     *
     * Use this instead of eager-loading `trips` with a `limit(1)` closure:
     * eager loading issues ONE query for every parent in the page, so a limit
     * inside it truncates the whole result set — the first schedule gets a
     * trip and every other schedule silently gets none. `latestOfMany()`
     * builds a per-parent subquery, which is what that code meant.
     */
    public function latestTrip(): HasOne { return $this->hasOne(Trip::class)->latestOfMany(); }
}
