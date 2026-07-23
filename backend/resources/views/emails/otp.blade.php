@extends('emails.layout')
@section('content')

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">{{ $tpl['heading'] }}</h1>
<p style="margin:0 0 4px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  Halo <strong>{{ $recipientName }}</strong>,
</p>
<p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  {{ $tpl['intro'] }}
</p>

{{-- The passcode. Letter-spaced and monospaced so 0/O and 1/l can't be
     misread, and selectable as plain text for copy-paste. --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:16px;">
  <tr><td align="center" style="padding:22px 16px;">
    <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">
      Kode {{ $isReset ? 'Reset Password' : 'Verifikasi' }}
    </div>
    <div style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:34px;font-weight:800;color:#0f172a;letter-spacing:.32em;line-height:1.2;padding-left:.32em;">
      {{ $code }}
    </div>
    <div style="font-size:12px;color:#64748b;margin-top:12px;">
      Berlaku <strong>{{ $expireMinutes }} menit</strong> dan hanya bisa dipakai satu kali.
    </div>
  </td></tr>
</table>

{{-- Request context: lets the recipient recognise a request they did not
     make. Shown only when we actually captured it. --}}
@if ($requestIp || $requestedAt)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
  <tr><td style="padding:0 4px;">
    <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">Detail permintaan</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      @if ($requestedAt)
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#64748b;">Waktu</td>
        <td style="padding:4px 0;font-size:12px;color:#334155;text-align:right;font-weight:600;">{{ $requestedAt }}</td>
      </tr>
      @endif
      @if ($requestIp)
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#64748b;">Alamat IP</td>
        <td style="padding:4px 0;font-size:12px;color:#334155;text-align:right;font-weight:600;">{{ $requestIp }}</td>
      </tr>
      @endif
    </table>
  </td></tr>
</table>
@endif

<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="margin-top:20px;background-color:#fef2f2;border-radius:14px;">
  <tr><td style="padding:14px 16px;">
    <p style="margin:0;font-size:12px;color:#991b1b;line-height:1.7;">
      <strong>Jaga kerahasiaan kode ini.</strong> Staf {{ $brandName }} tidak akan pernah meminta kode ini
      melalui telepon, WhatsApp, atau chat.
      @if ($isReset)
        Jika Anda tidak meminta reset password, abaikan email ini — password Anda tidak berubah, dan sebaiknya segera periksa keamanan akun Anda.
      @else
        Jika Anda tidak merasa mendaftar, abaikan email ini.
      @endif
    </p>
  </td></tr>
</table>

@endsection
