<?php

declare(strict_types=1);

namespace App\Support\Audit;

use Illuminate\Http\Request;

/**
 * Enriches audit metadata with the request context: acting user (id, name,
 * role), IP address, and a lightweight device/browser fingerprint parsed from
 * the User-Agent header. Controllers pass their domain metadata (including
 * optional `before`/`after` snapshots) and get back a single merged payload.
 */
final class RequestContext
{
    /** @param array<string, mixed> $metadata @return array<string, mixed> */
    public static function enrich(Request $request, array $metadata = []): array
    {
        $user = $request->user();
        $agent = (string) $request->userAgent();

        return $metadata + [
            'actor' => $user ? ['id' => $user->id, 'name' => $user->name, 'role' => $user->role] : null,
            'ip' => $request->ip(),
            'device' => self::device($agent),
            'browser' => self::browser($agent),
            'user_agent' => $agent !== '' ? mb_substr($agent, 0, 255) : null,
        ];
    }

    private static function device(string $agent): string
    {
        return match (true) {
            $agent === '' => 'unknown',
            (bool) preg_match('/ipad|tablet/i', $agent) => 'tablet',
            (bool) preg_match('/mobi|iphone|android/i', $agent) => 'mobile',
            default => 'desktop',
        };
    }

    private static function browser(string $agent): string
    {
        return match (true) {
            $agent === '' => 'unknown',
            str_contains($agent, 'Edg/') => 'Edge',
            str_contains($agent, 'OPR/') || str_contains($agent, 'Opera') => 'Opera',
            str_contains($agent, 'Chrome/') => 'Chrome',
            str_contains($agent, 'Firefox/') => 'Firefox',
            str_contains($agent, 'Safari/') => 'Safari',
            default => 'other',
        };
    }
}
