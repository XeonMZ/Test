{{ $tpl['heading'] }}

Halo {{ $recipientName }},

{{ $tpl['intro'] }}

KODE {{ $isReset ? 'RESET PASSWORD' : 'VERIFIKASI' }}: {{ $code }}

Kode berlaku {{ $expireMinutes }} menit dan hanya bisa dipakai satu kali.
@if ($requestedAt)

Waktu permintaan: {{ $requestedAt }}
@endif
@if ($requestIp)
Alamat IP: {{ $requestIp }}
@endif

Jaga kerahasiaan kode ini. Staf {{ $brandName }} tidak akan pernah meminta kode ini melalui telepon, WhatsApp, atau chat.
@if ($isReset)
Jika Anda tidak meminta reset password, abaikan email ini — password Anda tidak berubah.
@else
Jika Anda tidak merasa mendaftar, abaikan email ini.
@endif

--
{{ $brandName }} · {{ $supportEmail }}
{{ $siteUrl }}
