@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  @if ($stage === 'paid')<span style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">✓ TERKONFIRMASI</span>
  @elseif ($stage === 'cancelled')<span style="display:inline-block;background-color:#fef3c7;color:#b45309;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">DIBATALKAN</span>
  @else<span style="display:inline-block;background-color:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">MENUNGGU PEMBAYARAN</span>@endif
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">{{ $tpl['heading'] }}</h1>
<p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">{{ $tpl['intro'] }}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;">
  @foreach (['Kode Booking' => $code, 'Paket' => $packageName, 'Destinasi' => $destination, 'Tanggal' => $travelDate, 'Jumlah Pax' => $pax, 'Total' => $amount] as $label => $value)
    @if ($value !== null && $value !== '')
      <tr><td style="padding:9px 16px;font-size:12px;color:#64748b;">{{ $label }}</td><td style="padding:9px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $value }}</td></tr>
    @endif
  @endforeach
</table>
@if ($stage !== 'paid' && $stage !== 'cancelled' && $instructions)
<p style="margin:18px 0 0;font-size:13px;color:#475569;line-height:1.7;background-color:#fffbeb;border-radius:12px;padding:14px 16px;"><strong>Cara pembayaran:</strong><br>{{ $instructions }}</p>
@endif
@endsection
