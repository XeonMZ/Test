@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  <span style="display:inline-block;background-color:#fee2e2;color:#b91c1c;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">✕ PEMBAYARAN GAGAL</span>
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">Pembayaran Tidak Berhasil</h1>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  Halo {{ $name }}, pembayaran untuk booking <strong>{{ $bookingCode }}</strong> tidak berhasil diproses.
  @if ($reason) Alasan: <strong>{{ $reason }}</strong>.@endif
  Silakan coba lagi — kursi Anda akan dilepas otomatis bila pembayaran tidak diselesaikan.
</p>
@include('emails.partials.button', ['url' => $retryUrl, 'label' => 'Coba Bayar Lagi'])
<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">
  Butuh bantuan? <a href="mailto:mail@sekawanjayatrans.com" style="color:#1d4ed8;font-weight:700;">Hubungi Customer Support</a>
</p>
@endsection
