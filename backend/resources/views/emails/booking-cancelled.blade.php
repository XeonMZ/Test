@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  <span style="display:inline-block;background-color:#fef3c7;color:#b45309;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">BOOKING DIBATALKAN</span>
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">Booking {{ $bookingCode }} Dibatalkan</h1>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  Halo {{ $name }}, booking Anda telah dibatalkan.
  @if ($reason) Alasan: <strong>{{ $reason }}</strong>.@endif
</p>
@if ($refundStatus)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;">
  <tr><td style="padding:10px 16px;font-size:12px;color:#64748b;">Status Refund</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $refundStatus }}</td></tr>
  @if ($refundAmount)<tr><td style="padding:10px 16px;font-size:12px;color:#64748b;">Jumlah Refund</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $refundAmount }}</td></tr>@endif
</table>
@endif
<p style="margin:16px 0 0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">
  Ada pertanyaan mengenai pembatalan atau refund?
  <a href="mailto:mail@sekawanjayatrans.com" style="color:#1d4ed8;font-weight:700;">Hubungi Customer Support</a>
</p>
@endsection
