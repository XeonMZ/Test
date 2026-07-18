<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

final class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuid, Notifiable;

    protected $guarded = ['id'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime', 'password' => 'hashed', 'metadata' => 'array'];

    public function customer(): HasOne { return $this->hasOne(Customer::class); }
    public function driver(): HasOne { return $this->hasOne(Driver::class); }
    public function stmsNotifications(): HasMany { return $this->hasMany(Notification::class); }

    /**
     * Password-broker hook: sends the reset link through the queued Resend
     * pipeline (branded template, email_logs audit, retry w/ backoff) instead
     * of the framework's default notification. The token itself remains the
     * broker's hashed single-use token; the minute-bucket dedupe key allows a
     * fresh link after re-request without permitting rapid duplicates.
     */
    public function sendPasswordResetNotification($token): void
    {
        $resetUrl = (string) config('authentication.password_reset_url')
            .'?token='.urlencode((string) $token)
            .'&email='.urlencode((string) $this->email);

        app(\App\Support\Mail\TransactionalMailer::class)->queue(
            'reset_password',
            (string) $this->email,
            'Reset Your Password - SJT Travel',
            new \App\Mail\ResetPasswordMail($this, $resetUrl, (int) config('auth.passwords.users.expire', 60)),
            'user:'.$this->getKey().':'.now()->format('YmdHi'),
            (int) $this->getKey(),
        );

        \App\Models\ActivityLog::create(['action' => 'auth.password_reset_requested', 'subject_type' => 'User', 'subject_id' => $this->getKey(), 'metadata' => ['email' => $this->email]]);
    }
}
