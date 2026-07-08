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

final class Booking extends Model
{
    use HasFactory, HasUuid, SoftDeletes;

    protected $guarded = ['id'];
    protected $hidden = ['deleted_at'];
    protected $casts = ['metadata'=>'array','settings'=>'array','value'=>'array','starts_at'=>'datetime','ends_at'=>'datetime','departure_at'=>'datetime','arrival_at'=>'datetime','expires_at'=>'datetime','paid_at'=>'datetime','cancelled_at'=>'datetime','locked_until'=>'datetime','released_at'=>'datetime','is_active'=>'boolean','enabled'=>'boolean','amount'=>'decimal:2','base_fare'=>'decimal:2'];

    public function schedule(): BelongsTo { return $this->belongsTo(Schedule::class); }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }

    public function passengers(): HasMany { return $this->hasMany(Passenger::class); }

    public function ticket(): HasOne { return $this->hasOne(Ticket::class); }

    public function payment(): HasOne { return $this->hasOne(Payment::class); }

    public function seatReservations(): HasMany { return $this->hasMany(SeatReservation::class); }
}
