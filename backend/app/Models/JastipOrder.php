<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

final class JastipOrder extends Model
{
    use HasFactory, HasUuid, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = ['metadata' => 'array', 'fee' => 'decimal:2', 'pickup_lat' => 'float', 'pickup_lng' => 'float', 'drop_lat' => 'float', 'drop_lng' => 'float'];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
