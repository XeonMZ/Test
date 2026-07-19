PEMBAYARAN BERHASIL — Booking Terkonfirmasi

Terima kasih, {{ $inv['passenger_name'] }}!

No. Invoice   : {{ $inv['invoice_number'] }}
Kode Booking  : {{ $inv['booking_code'] }}
Status        : LUNAS (Paid)
Metode        : {{ $inv['payment_method'] }}
Penumpang     : {{ $inv['passenger_name'] }} ({{ $inv['phone'] }})
Rute          : {{ $inv['pickup'] }} -> {{ $inv['destination'] }}
Berangkat     : {{ $inv['departure_date'] }} {{ $inv['departure_time'] }}
Kursi         : {{ $inv['seats'] }}
Kendaraan     : {{ $inv['vehicle'] }}@if($inv['driver']) / Driver: {{ $inv['driver'] }}@endif

@foreach ($inv['breakdown'] as $row)
{{ $row['label'] }}: {{ $row['value'] }}
@endforeach
GRAND TOTAL   : {{ $inv['grand_total'] }}

Lihat booking: {{ $inv['booking_url'] }}

SJT Travel — mail@sekawanjayatrans.com — sekawanjayatrans.com
