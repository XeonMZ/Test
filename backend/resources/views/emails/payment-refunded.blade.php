@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  <span style="display:inline-block;background-color:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">REFUND DIPROSES</span>
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">Refund Booking {{ $bookingCode }}</h1>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  Halo {{ $name }}, refund sebesar <strong>{{ $amount }}</strong> untuk booking <strong>{{ $bookingCode }}</strong> telah diproses.
  Dana akan kembali sesuai kebijakan penyedia pembayaran Anda (umumnya 3–14 hari kerja).
</p>
<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">
  Ada pertanyaan? <a href="mailto:mail@sekawanjayatrans.com" style="color:#1d4ed8;font-weight:700;">Hubungi Customer Support</a>
</p>
@endsection
