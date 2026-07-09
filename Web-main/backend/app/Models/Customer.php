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

final class Customer extends Model
{
    use HasFactory, HasUuid, SoftDeletes;

    protected $guarded = ['id'];
    protected $hidden = ['deleted_at'];
    protected $casts = ['metadata'=>'array','settings'=>'array','value'=>'array','starts_at'=>'datetime','ends_at'=>'datetime','departure_at'=>'datetime','arrival_at'=>'datetime','is_active'=>'boolean','enabled'=>'boolean','amount'=>'decimal:2','base_fare'=>'decimal:2'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function bookings(): HasMany { return $this->hasMany(Booking::class); }

    public function membership(): HasOne { return $this->hasOne(Membership::class); }
}
