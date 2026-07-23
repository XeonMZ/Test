<?php

declare(strict_types=1);

namespace App\Support\Mail;

use App\Models\SystemSetting;

/**
 * CMS-editable email templates. Admin/owner store overrides in the
 * `email_templates` System Setting (JSON keyed by type):
 *
 *   {"payment_success": {"subject": "...", "heading": "Terima kasih, {name}!",
 *                        "intro": "..."}}
 *
 * `resolve()` merges overrides over the code defaults and substitutes
 * {placeholders} from the given context. Overrides are plain text only —
 * Blade escapes them on render, so no markup/script can be injected into
 * the emails through the CMS.
 */
final class EmailTemplate
{
    public const TYPES = [
        'verify_email', 'reset_password', 'payment_success', 'payment_failed',
        'booking_cancelled', 'payment_refunded', 'package_booking', 'dp_settlement_reminder',
    ];

    /**
     * @param array{subject: string, heading: string, intro: string} $defaults
     * @param array<string, string|int|float|null> $context
     * @return array{subject: string, heading: string, intro: string}
     */
    public static function resolve(string $type, array $defaults, array $context = []): array
    {
        $all = self::all();
        $override = is_array($all[$type] ?? null) ? $all[$type] : [];

        $replacements = [];
        foreach ($context as $key => $value) {
            $replacements['{'.$key.'}'] = (string) ($value ?? '');
        }

        $out = [];
        foreach (['subject', 'heading', 'intro'] as $field) {
            $raw = trim((string) ($override[$field] ?? '')) ?: $defaults[$field];
            $out[$field] = strtr($raw, $replacements);
        }
        return $out;
    }

    /** @return array<string, mixed> */
    public static function all(): array
    {
        $value = SystemSetting::query()->where('key', 'email_templates')->value('value');
        if (is_array($value)) {
            return isset($value['value']) && is_array($value['value']) ? $value['value'] : $value;
        }
        $decoded = json_decode((string) $value, true);
        return is_array($decoded) ? $decoded : [];
    }
}
