@extends('emails.layout')
@section('content')
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Reset Password</h1>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
  Halo {{ $user->name }}, kami menerima permintaan untuk mereset password akun SJT Travel Anda.
  Tekan tombol di bawah untuk membuat password baru.
</p>
@include('emails.partials.button', ['url' => $resetUrl, 'label' => 'Reset Password'])
<p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.7;">
  Jika tombol tidak berfungsi, salin dan buka tautan berikut:<br>
  <a href="{{ $resetUrl }}" style="color:#1d4ed8;word-break:break-all;">{{ $resetUrl }}</a>
</p>
<p style="margin:12px 0 0;font-size:12px;color:#64748b;line-height:1.7;">
  Tautan berlaku selama <strong>{{ $expireMinutes }} menit</strong> dan hanya dapat digunakan satu kali.
  Jika Anda tidak meminta reset password, abaikan email ini — password Anda tetap aman.
</p>
@endsection
