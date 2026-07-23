<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>{{ $subject ?? $brandName }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

{{-- Preheader: the grey line clients show next to the subject. Hidden in the
     body itself so it never renders twice. --}}
@isset($preheader)
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">{{ $preheader }}</div>
@endisset

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  {{-- Header banner. Blocked-image fallback is the alt text plus the accent
       band underneath, so the email still reads as ours with images off. --}}
  <tr><td align="center" style="padding:0 0 18px;">
    @if ($headerImage)
      <a href="{{ $siteUrl }}" style="text-decoration:none;">
        <img src="{{ $headerImage }}" alt="{{ $brandName }} — {{ $brandTagline }}" width="560"
             style="display:block;width:100%;max-width:560px;height:auto;border:0;outline:none;text-decoration:none;border-radius:18px;">
      </a>
    @else
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:{{ $accent }};border-radius:18px;">
        <tr><td align="center" style="padding:24px 20px;">
          @if ($logo)
            <img src="{{ $logo }}" alt="{{ $brandName }}" width="52" height="52"
                 style="display:block;margin:0 auto 10px;border:0;border-radius:14px;">
          @endif
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.01em;">{{ $brandName }}</div>
          <div style="font-size:11px;color:#dbeafe;letter-spacing:.14em;text-transform:uppercase;margin-top:4px;">{{ $brandTagline }}</div>
        </td></tr>
      </table>
    @endif
  </td></tr>

  {{-- Card --}}
  <tr><td style="background-color:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 1px 4px rgba(15,23,42,0.06);">
    @yield('content')
  </td></tr>

  {{-- Footer --}}
  <tr><td align="center" style="padding:24px 12px 8px;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      <strong style="color:#334155;">{{ $brandName }}</strong><br>
      <a href="mailto:{{ $supportEmail }}" style="color:{{ $accent }};text-decoration:none;">{{ $supportEmail }}</a>
      &nbsp;·&nbsp;
      <a href="{{ $siteUrl }}" style="color:{{ $accent }};text-decoration:none;">{{ preg_replace('#^https?://#', '', $siteUrl) }}</a><br>
      Butuh bantuan? Hubungi Customer Support kami melalui email di atas.<br>
      © {{ date('Y') }} {{ $brandName }}. Seluruh hak cipta dilindungi.
    </p>
    <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;line-height:1.7;">
      Email ini dikirim otomatis ke {{ $toAddress ?? 'alamat terdaftar Anda' }} terkait aktivitas akun Anda.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
