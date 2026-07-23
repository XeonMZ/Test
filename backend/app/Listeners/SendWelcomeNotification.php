<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Support\Settings\SettingKey;

/**
 * Creates the in-app welcome notification when an account is registered.
 *
 * This is the durable inbox entry — the card the customer sees under
 * "Notifikasi". It is NOT the welcome pop-up: the pop-up is a per-session
 * interruption on the public site, configured under its own `welcome_popup_*`
 * keys. They are separate settings on purpose, so silencing the marketing
 * modal never silences the account-created message, and vice versa.
 *
 * Title and body are editable from Settings; the hardcoded strings survive
 * only as fallbacks so an unconfigured install still says something sensible
 * rather than creating a blank notification.
 */
final class SendWelcomeNotification
{
    private const DEFAULT_TITLE = 'Selamat datang di STMS';
    private const DEFAULT_BODY = 'Akun customer Anda berhasil dibuat.';

    public function handle(UserRegistered $event): void
    {
        if (! $this->enabled()) {
            return;
        }

        Notification::create([
            'user_id' => $event->user->id,
            'type' => 'welcome',
            'title' => $this->setting(SettingKey::WelcomeNotificationTitle, self::DEFAULT_TITLE),
            'body' => $this->setting(SettingKey::WelcomeNotificationBody, self::DEFAULT_BODY),
            'metadata' => [],
        ]);
    }

    /** Defaults to on: an install that never touched Settings keeps today's behaviour. */
    private function enabled(): bool
    {
        $raw = $this->raw(SettingKey::WelcomeNotificationEnabled);

        if ($raw === null || $raw === '') {
            return true;
        }

        return filter_var($raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
    }

    private function setting(SettingKey $key, string $fallback): string
    {
        $value = trim((string) $this->raw($key));

        return $value === '' ? $fallback : $value;
    }

    /** Settings are cast to array, so a scalar may arrive wrapped as ['value' => x]. */
    private function raw(SettingKey $key): string|int|bool|null
    {
        $value = SystemSetting::query()->where('key', $key->value)->value('value');

        if (is_array($value)) {
            $value = $value['value'] ?? null;
        }

        return is_scalar($value) ? $value : null;
    }
}
