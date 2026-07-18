@extends('emails.layout')
@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Selamat datang, {{ $user->name }}! 👋</h1>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
  Terima kasih telah mendaftar di <strong>SJT Travel</strong>. Sebelum akun dapat digunakan sepenuhnya,
  mohon verifikasi alamat email Anda dengan menekan tombol di bawah ini.
</p>
@include('emails.partials.button', ['url' => $verificationUrl, 'label' => 'Verifikasi Email'])
<p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.7;">
  Jika tombol tidak berfungsi, salin dan buka tautan berikut di browser Anda:<br>
  <a href="{{ $verificationUrl }}" style="color:#1d4ed8;word-break:break-all;">{{ $verificationUrl }}</a>
</p>
<p style="margin:12px 0 0;font-size:12px;color:#64748b;line-height:1.7;">
  Tautan ini berlaku selama <strong>{{ $expireMinutes >= 60 ? intdiv($expireMinutes, 60).' jam' : $expireMinutes.' menit' }}</strong>.
  Jika Anda tidak merasa mendaftar, abaikan email ini — tidak ada tindakan yang diperlukan.
</p>
@endsection
