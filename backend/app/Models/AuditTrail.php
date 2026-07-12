<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class AuditTrail extends Model
{
    use HasFactory;

    public $timestamps = true;
    protected $guarded = ['id'];
    protected $casts = ['metadata' => 'array'];

    public static function record(string $action, string $subject, ?string $actorType = null, ?string $actorUuid = null, array $metadata = []): self
    {
        return self::create([
            'action' => $action,
            'subject' => $subject,
            'actor_type' => $actorType,
            'actor_uuid' => $actorUuid,
            'correlation_id' => (string) \Illuminate\Support\Str::uuid(),
            'metadata' => $metadata,
        ]);
    }
}
