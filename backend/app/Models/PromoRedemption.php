<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;

/**
 * Permanent per-customer promo/voucher usage ledger (#9). A row here means
 * the customer has consumed the promo forever — UNIQUE(promo_id, customer_id).
 */
final class PromoRedemption extends Model
{
    use HasUuid;

    protected $guarded = [];

    public function promo() { return $this->belongsTo(Promo::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function booking() { return $this->belongsTo(Booking::class); }
}
