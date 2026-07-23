<?php

declare(strict_types=1);

namespace App\Support\Mail;

/**
 * Brand assets for the transactional email header.
 *
 * Every outbound email carries this header, which makes the image URL a
 * high-value target: anyone who could point it at their own host would get a
 * read receipt on every customer email (an open-tracking beacon leaking IP,
 * client and timing) and a foothold for phishing that renders inside our
 * otherwise-trusted template.
 *
 * So the URL is *not* taken on faith from configuration. It must be HTTPS and
 * live on an allowlisted host; anything else is discarded and the header
 * degrades to the pure-HTML wordmark, which needs no network fetch at all.
 */
final class MailBranding
{
    /** Hosts permitted to serve email imagery. Extend deliberately. */
    private const ALLOWED_IMAGE_HOSTS = [
        'sekawanjayatrans.com',
        'www.sekawanjayatrans.com',
        'cdn.sekawanjayatrans.com',
        'res.cloudinary.com',
    ];

    /** Banner shown at the top of every email, or null to use the wordmark. */
    public static function headerImage(): ?string
    {
        return self::safeUrl((string) config('branding.header_image_url', ''));
    }

    /** Small square logo rendered beside the brand name. */
    public static function logo(): ?string
    {
        return self::safeUrl((string) config('branding.logo_url', ''));
    }

    public static function brandName(): string
    {
        return (string) config('branding.name', 'SJT Travel');
    }

    public static function brandTagline(): string
    {
        return (string) config('branding.tagline', 'Sekawan Jaya Trans');
    }

    public static function supportEmail(): string
    {
        return (string) config('branding.support_email', 'mail@sekawanjayatrans.com');
    }

    public static function siteUrl(): string
    {
        return rtrim((string) config('branding.site_url', 'https://sekawanjayatrans.com'), '/');
    }

    /** Accent band colour behind the header. */
    public static function accent(): string
    {
        $colour = (string) config('branding.accent', '#1d4ed8');

        // Only a literal hex triple/sextet may reach the style attribute —
        // anything else could break out of the CSS context.
        return preg_match('/^#[0-9a-fA-F]{6}$/', $colour) === 1 ? $colour : '#1d4ed8';
    }

    /** @return array<string, mixed> Everything the layout partial needs. */
    public static function forView(): array
    {
        return [
            'headerImage' => self::headerImage(),
            'logo' => self::logo(),
            'brandName' => self::brandName(),
            'brandTagline' => self::brandTagline(),
            'supportEmail' => self::supportEmail(),
            'siteUrl' => self::siteUrl(),
            'accent' => self::accent(),
        ];
    }

    /** HTTPS + allowlisted host, or nothing. */
    private static function safeUrl(string $url): ?string
    {
        $url = trim($url);
        if ($url === '') {
            return null;
        }

        $parts = parse_url($url);
        if ($parts === false || ($parts['scheme'] ?? '') !== 'https') {
            return null;
        }

        $host = mb_strtolower((string) ($parts['host'] ?? ''));
        if (! in_array($host, self::ALLOWED_IMAGE_HOSTS, true)) {
            return null;
        }

        // Credentials in a URL are never legitimate here and render oddly in
        // several clients; treat their presence as tampering.
        if (isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }

        return $url;
    }
}
