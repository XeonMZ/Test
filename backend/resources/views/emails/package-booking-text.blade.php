{{ $tpl['heading'] }}

{{ $tpl['intro'] }}

Kode: {{ $code }} | Paket: {{ $packageName }} | Tanggal: {{ $travelDate }} | Pax: {{ $pax }} | Total: {{ $amount }}
@if ($isDp ?? false)
Skema: DP {{ $dpPercent ? $dpPercent.'%' : '' }} | Sudah dibayar: {{ $paidAmount }}@if (! ($isSettled ?? false)) | Sisa: {{ $outstanding }}@endif
Status: {{ ($isSettled ?? false) ? 'LUNAS' : 'BELUM LUNAS' }}
@endif
@if ($instructions)Cara pembayaran: {{ $instructions }}@endif

SJT Travel — mail@sekawanjayatrans.com — sekawanjayatrans.com
