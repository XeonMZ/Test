<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

final class CmsVersion extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['snapshot' => 'array', 'published_at' => 'datetime'];

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(User::class, 'created_by'); }

    protected static function booted(): void
    {
        static::creating(fn (self $m) => $m->uuid ??= (string) Str::uuid());
    }
}
