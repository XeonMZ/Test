<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single one-time passcode. See the migration for the security rationale.
 *
 * `code_hash` is $hidden so it can never leak through an accidental
 * `toJson()`/`toArray()` on a response payload or a log line.
 */
final class OtpCode extends Model
{
    use HasFactory, HasUuid;

    protected $guarded = ['id'];

    protected $hidden = ['code_hash'];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }
}
