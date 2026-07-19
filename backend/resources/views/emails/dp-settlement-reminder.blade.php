@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  <span style="display:inline-block;background-color:#fef3c7;color:#b45309;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">⏰ PELUNASAN MENUNGGU</span>
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">{{ $tpl['heading'] }}</h1>
<p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">{{ $tpl['intro'] }}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;">
  <tr><td style="padding:11px 16px;font-size:12px;color:#64748b;">Sisa Pelunasan</td><td style="padding:11px 16px;font-size:16px;font-weight:800;color:#1d4ed8;text-align:right;">{{ $remaining }}</td></tr>
  <tr><td style="padding:11px 16px;font-size:12px;color:#64748b;">Batas Waktu</td><td style="padding:11px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $deadline }}</td></tr>
</table>
@include('emails.partials.button', ['url' => $settlementUrl, 'label' => 'Selesaikan Pelunasan'])
<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">Butuh bantuan? <a href="mailto:mail@sekawanjayatrans.com" style="color:#1d4ed8;font-weight:700;">Hubungi Customer Support</a></p>
@endsection
