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

    /** Money comparisons on decimals cast to float need a cent-level epsilon. */
    private const EPSILON = 0.009;

    protected $guarded = ['id'];

    protected $casts = [
        'travel_date' => 'date',
        'paid_at' => 'datetime',
        'settled_at' => 'datetime',
        'settlement_claimed_at' => 'datetime',
        'amount' => 'float',
        'dp_amount' => 'float',
        'paid_amount' => 'float',
        'dp_percent' => 'integer',
        'payment_payload' => 'array',
        'payment_expires_at' => 'datetime',
        'settlement_payload' => 'array',
        'settlement_expires_at' => 'datetime',
    ];

    /** Exposed on every JSON response so clients never recompute the money. */
    protected $appends = ['outstanding_amount', 'is_settled', 'is_dp'];

    protected static function booted(): void
    {
        static::creating(function (self $m): void {
            $m->uuid ??= (string) Str::uuid();
            $m->code ??= 'PKG-'.strtoupper(Str::random(6));
        });
    }

    public function tourPackage(): BelongsTo { return $this->belongsTo(TourPackage::class); }

    /**
     * Alias for tourPackage().
     *
     * The rating endpoints and the customer UI refer to this booking's package
     * as `package`; keeping the alias means both names resolve instead of
     * throwing "Call to undefined relationship".
     */
    public function package(): BelongsTo { return $this->belongsTo(TourPackage::class, 'tour_package_id'); }

    public function customer(): BelongsTo { return $this->belongsTo(Customer::class); }

    // ------------------------------ Money ------------------------------

    public function getIsDpAttribute(): bool
    {
        return $this->payment_type === 'dp';
    }

    /** What is still owed. Never negative, even if over-collected. */
    public function getOutstandingAmountAttribute(): float
    {
        return round(max(0.0, (float) $this->amount - (float) $this->paid_amount), 2);
    }

    public function getIsSettledAttribute(): bool
    {
        return $this->outstanding_amount <= self::EPSILON;
    }

    /**
     * The amount the customer should be charged for their next action.
     *
     * Before anything is received that is the first instalment (the DP for a
     * DP booking, otherwise the whole total). Afterwards it is whatever is
     * left. Centralised here so the gateway charge, the manual instructions
     * and the UI can never disagree about the figure.
     */
    public function amountDueNow(): float
    {
        if ((float) $this->paid_amount <= self::EPSILON) {
            return $this->is_dp && $this->dp_amount !== null
                ? round((float) $this->dp_amount, 2)
                : round((float) $this->amount, 2);
        }

        return $this->outstanding_amount;
    }

    /** True once the first instalment is in and money is still owed. */
    public function awaitingSettlement(): bool
    {
        return $this->status === 'paid' && ! $this->is_settled;
    }
}
