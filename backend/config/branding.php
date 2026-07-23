<?php

declare(strict_types=1);

/**
 * Brand assets used by transactional emails.
 *
 * The two image URLs are validated at render time by App\Support\Mail\MailBranding
 * (HTTPS + host allowlist). Setting them to an off-allowlist host does not
 * break the emails — the header silently falls back to the HTML wordmark.
 */
return [
    'name' => env('BRAND_NAME', 'SJT Travel'),
    'tagline' => env('BRAND_TAGLINE', 'Sekawan Jaya Trans'),

    /** Wide banner across the top of every email. ~1200x300, PNG/JPG. */
    'header_image_url' => env('MAIL_HEADER_IMAGE_URL', ''),

    /** Square logo beside the brand name. ~200x200. */
    'logo_url' => env('MAIL_LOGO_URL', ''),

    'accent' => env('BRAND_ACCENT', '#1d4ed8'),
    'support_email' => env('MAIL_SUPPORT_EMAIL', 'mail@sekawanjayatrans.com'),
    'site_url' => env('FRONTEND_URL', 'https://sekawanjayatrans.com'),
];
