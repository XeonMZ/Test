INVOICE {{ $inv['invoice_number'] }} — {{ $inv['status_label'] }}

{{ $tpl['heading'] }}
{{ $tpl['intro'] }}

DITERBITKAN OLEH
{{ $inv['issuer_name'] }} ({{ $inv['issuer_legal'] }})
{{ $inv['issuer_email'] }}

DITAGIHKAN KEPADA
{{ $inv['customer_name'] }}
@if ($inv['customer_email']){{ $inv['customer_email'] }}
@endif
{{ $inv['phone'] }}

No. Invoice     : {{ $inv['invoice_number'] }}
Tanggal terbit  : {{ $inv['issued_at'] }}
Kode Booking    : {{ $inv['booking_code'] }}

DETAIL PERJALANAN
Rute            : {{ $inv['pickup'] }} -> {{ $inv['destination'] }}
Tanggal         : {{ $inv['departure_date'] }}
Jam berangkat   : {{ $inv['departure_time'] }}
@if ($inv['arrival_estimate'])Perkiraan tiba  : {{ $inv['arrival_estimate'] }}
@endif
Kendaraan       : {{ $inv['vehicle'] }}
@if ($inv['driver'])Driver          : {{ $inv['driver'] }}
@endif
Nomor kursi     : {{ $inv['seats'] }}

@if (count($inv['manifest']) > 0)
DAFTAR PENUMPANG
@foreach ($inv['manifest'] as $p)
- {{ $p['name'] }}{{ $p['seat'] ? ' (kursi '.$p['seat'].')' : '' }}{{ $p['identity'] ? ' — '.$p['identity'] : '' }}
@endforeach
@endif

PEMBAYARAN
Metode          : {{ $inv['payment_method'] }}
@if ($inv['payment_reference'])No. Referensi   : {{ $inv['payment_reference'] }}
@endif
@if ($inv['paid_at'])Waktu bayar     : {{ $inv['paid_at'] }}
@endif

RINCIAN BIAYA
@foreach ($inv['breakdown'] as $row)
{{ $row['label'] }}: {{ $row['value'] }}
@endforeach
Total Tagihan   : {{ $inv['booking_total'] }}
Sudah Dibayar   : {{ $inv['amount_paid'] }}
@if ($inv['outstanding'])Sisa Pembayaran : {{ $inv['outstanding'] }}
(Wajib dilunasi sebelum keberangkatan.)
@endif

Lihat booking: {{ $inv['booking_url'] }}

Tunjukkan Kode Booking {{ $inv['booking_code'] }} kepada petugas saat keberangkatan.
Invoice ini sah tanpa tanda tangan dan dibuat otomatis oleh sistem.

--
{{ $brandName }} · {{ $supportEmail }}
{{ $siteUrl }}
