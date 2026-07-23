@extends('emails.layout')
@section('content')

@php($muted = 'font-size:12px;color:#64748b;')
@php($val = 'font-size:13px;font-weight:700;color:#0f172a;text-align:right;')

<div style="text-align:center;margin-bottom:14px;">
  <span style="display:inline-block;background-color:{{ $inv['is_partial'] ? '#fef3c7' : '#dcfce7' }};color:{{ $inv['is_partial'] ? '#92400e' : '#15803d' }};font-size:12px;font-weight:800;padding:6px 14px;border-radius:999px;">
    {{ $inv['is_partial'] ? '● ' : '✓ ' }}{{ $inv['status_label'] }}
  </span>
</div>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;">{{ $tpl['heading'] }}</h1>
<p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.7;text-align:center;">{{ $tpl['intro'] }}</p>

{{-- Invoice header: who issued it, to whom, when --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:14px;">
  <tr>
    <td style="padding:16px;vertical-align:top;width:50%;">
      <div style="{{ $muted }}text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:10px;margin-bottom:6px;">Diterbitkan oleh</div>
      <div style="font-size:13px;font-weight:800;color:#0f172a;">{{ $inv['issuer_name'] }}</div>
      <div style="{{ $muted }}line-height:1.6;">{{ $inv['issuer_legal'] }}<br>{{ $inv['issuer_email'] }}</div>
    </td>
    <td style="padding:16px;vertical-align:top;width:50%;">
      <div style="{{ $muted }}text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:10px;margin-bottom:6px;">Ditagihkan kepada</div>
      <div style="font-size:13px;font-weight:800;color:#0f172a;">{{ $inv['customer_name'] }}</div>
      <div style="{{ $muted }}line-height:1.6;">
        @if ($inv['customer_email']){{ $inv['customer_email'] }}<br>@endif
        {{ $inv['phone'] }}
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:0 16px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;">
        <tr>
          <td style="padding:10px 0 0;{{ $muted }}">No. Invoice</td>
          <td style="padding:10px 0 0;{{ $val }}">{{ $inv['invoice_number'] }}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;{{ $muted }}">Tanggal terbit</td>
          <td style="padding:4px 0;{{ $val }}">{{ $inv['issued_at'] }}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;{{ $muted }}">Kode Booking</td>
          <td style="padding:4px 0;{{ $val }}">{{ $inv['booking_code'] }}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

{{-- Trip --}}
<div style="{{ $muted }}text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:10px;margin:20px 0 8px;">Detail perjalanan</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;">
  @foreach ([
    'Rute' => ($inv['route_code'] ? $inv['route_code'].' · ' : '').$inv['pickup'].' → '.$inv['destination'],
    'Titik jemput' => $inv['pickup'],
    'Tujuan' => $inv['destination'],
    'Tanggal berangkat' => $inv['departure_date'],
    'Jam berangkat' => $inv['departure_time'],
    'Perkiraan tiba' => $inv['arrival_estimate'],
    'Kendaraan' => $inv['vehicle'],
    'Driver' => $inv['driver'],
    'Nomor kursi' => $inv['seats'],
  ] as $label => $value)
    @if ($value !== null && $value !== '' && $value !== '—')
      <tr>
        <td style="padding:9px 16px;{{ $muted }}white-space:nowrap;">{{ $label }}</td>
        <td style="padding:9px 16px;{{ $val }}">{{ $value }}</td>
      </tr>
    @endif
  @endforeach
</table>

{{-- Passenger manifest --}}
@if (count($inv['manifest']) > 0)
<div style="{{ $muted }}text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:10px;margin:20px 0 8px;">Daftar penumpang</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:14px;">
  <tr style="background-color:#f8fafc;">
    <td style="padding:8px 14px;{{ $muted }}font-weight:700;">Nama</td>
    <td style="padding:8px 14px;{{ $muted }}font-weight:700;">No. Identitas</td>
    <td style="padding:8px 14px;{{ $muted }}font-weight:700;text-align:right;">Kursi</td>
  </tr>
  @foreach ($inv['manifest'] as $p)
  <tr>
    <td style="padding:9px 14px;font-size:13px;font-weight:700;color:#0f172a;">{{ $p['name'] }}</td>
    <td style="padding:9px 14px;font-size:12px;color:#64748b;">{{ $p['identity'] ?? '—' }}</td>
    <td style="padding:9px 14px;font-size:13px;font-weight:800;color:#1d4ed8;text-align:right;">{{ $p['seat'] ?? '—' }}</td>
  </tr>
  @endforeach
</table>
@endif

{{-- Payment --}}
<div style="{{ $muted }}text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:10px;margin:20px 0 8px;">Pembayaran</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:14px;">
  @foreach ([
    'Metode' => $inv['payment_method'],
    'Penyedia' => $inv['payment_provider'],
    'No. Referensi' => $inv['payment_reference'],
    'Waktu pembayaran' => $inv['paid_at'],
  ] as $label => $value)
    @if ($value !== null && $value !== '' && $value !== '—')
      <tr>
        <td style="padding:9px 16px;{{ $muted }}white-space:nowrap;">{{ $label }}</td>
        <td style="padding:9px 16px;{{ $val }}word-break:break-all;">{{ $value }}</td>
      </tr>
    @endif
  @endforeach
</table>

{{-- Money --}}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:2px dashed #e2e8f0;">
  @foreach ($inv['breakdown'] as $row)
    <tr>
      <td style="padding:7px 16px;font-size:13px;color:#475569;">{{ $row['label'] }}</td>
      <td style="padding:7px 16px;{{ $val }}">{{ $row['value'] }}</td>
    </tr>
  @endforeach
  <tr>
    <td style="padding:10px 16px;font-size:14px;font-weight:800;color:#0f172a;border-top:1px solid #e2e8f0;">Total Tagihan</td>
    <td style="padding:10px 16px;font-size:15px;font-weight:800;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">{{ $inv['booking_total'] }}</td>
  </tr>
  <tr>
    <td style="padding:7px 16px;font-size:13px;color:#15803d;font-weight:700;">Sudah Dibayar</td>
    <td style="padding:7px 16px;font-size:13px;color:#15803d;font-weight:800;text-align:right;">{{ $inv['amount_paid'] }}</td>
  </tr>
  @if ($inv['outstanding'])
  <tr>
    <td style="padding:12px 16px;font-size:15px;font-weight:800;color:#92400e;">Sisa Pembayaran</td>
    <td style="padding:12px 16px;font-size:18px;font-weight:800;color:#92400e;text-align:right;">{{ $inv['outstanding'] }}</td>
  </tr>
  @endif
</table>

@if ($inv['is_partial'])
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background-color:#fffbeb;border-radius:12px;">
  <tr><td style="padding:12px 16px;font-size:12px;color:#92400e;line-height:1.7;">
    Booking ini dibayar sebagian (DP). Sisa pembayaran <strong>{{ $inv['outstanding'] }}</strong> wajib dilunasi sebelum keberangkatan.
  </td></tr>
</table>
@endif

@include('emails.partials.button', ['url' => $inv['booking_url'], 'label' => 'Lihat Booking'])

<p style="margin:0;font-size:12px;color:#64748b;text-align:center;line-height:1.7;">
  Tunjukkan <strong>Kode Booking {{ $inv['booking_code'] }}</strong> kepada petugas saat keberangkatan.<br>
  Invoice ini sah tanpa tanda tangan dan dibuat otomatis oleh sistem.<br>
  Ada pertanyaan? Balas email ini atau hubungi Customer Support kami.
</p>

@endsection
