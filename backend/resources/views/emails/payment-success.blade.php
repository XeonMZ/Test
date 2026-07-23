@extends('emails.layout')
@section('content')
<div style="text-align:center;margin-bottom:16px;">
  <span style="display:inline-block;background-color:#dcfce7;color:#15803d;font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">✓ PEMBAYARAN BERHASIL</span>
</div>
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">{{ $tpl['heading'] ?? 'Terima kasih, '.$inv['passenger_name'].'!' }}</h1>
<p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">
  {{ $tpl['intro'] ?? 'Pembayaran Anda telah kami terima dan booking Anda terkonfirmasi.' }}
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;padding:4px;">
  @foreach ([
    'No. Invoice' => $inv['invoice_number'],
    'Kode Booking' => $inv['booking_code'],
    'Status' => 'LUNAS (Paid)',
    'Metode Pembayaran' => $inv['payment_method'],
    'Penumpang' => $inv['passenger_name'],
    'No. HP' => $inv['phone'],
    'Titik Jemput' => $inv['pickup'],
    'Tujuan' => $inv['destination'],
    'Tanggal Berangkat' => $inv['departure_date'],
    'Jam Berangkat' => $inv['departure_time'],
    'Nomor Kursi' => $inv['seats'],
    'Kendaraan' => $inv['vehicle'],
    'Driver' => $inv['driver'],
  ] as $label => $value)
    @if ($value !== null && $value !== '')
      <tr>
        <td style="padding:9px 16px;font-size:12px;color:#64748b;white-space:nowrap;">{{ $label }}</td>
        <td style="padding:9px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $value }}</td>
      </tr>
    @endif
  @endforeach
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:2px dashed #e2e8f0;">
  @foreach ($inv['breakdown'] as $row)
    <tr>
      <td style="padding:7px 16px;font-size:13px;color:#475569;">{{ $row['label'] }}</td>
      <td style="padding:7px 16px;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">{{ $row['value'] }}</td>
    </tr>
  @endforeach
  <tr>
    <td style="padding:12px 16px;font-size:15px;font-weight:800;color:#0f172a;">Grand Total</td>
    <td style="padding:12px 16px;font-size:18px;font-weight:800;color:#1d4ed8;text-align:right;">{{ $inv['grand_total'] }}</td>
  </tr>
</table>

@include('emails.partials.button', ['url' => $inv['booking_url'], 'label' => 'Lihat Booking'])

<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">
  Tunjukkan <strong>Kode Booking {{ $inv['booking_code'] }}</strong> kepada petugas saat keberangkatan.<br>
  Ada pertanyaan? Balas email ini atau hubungi Customer Support kami.
</p>
@endsection
