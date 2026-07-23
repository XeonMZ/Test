<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One send activity in the Notification Center: a broadcast, a personal
 * message, or a draft of either. Per-recipient rows live in `notifications`
 * (relation: recipients), so read/unread stats aggregate over that table.
 */
final class NotificationActivity extends Model
{
    use HasFactory, HasUuid;

    protected $guarded = ['id'];
    protected $casts = ['sent_at' => 'datetime'];

    public function sender(): BelongsTo { return $this->belongsTo(User::class, 'sender_id'); }

    public function targetUser(): BelongsTo { return $this->belongsTo(User::class, 'target_user_id'); }

    public function recipients(): HasMany { return $this->hasMany(Notification::class, 'notification_activity_id'); }
}
