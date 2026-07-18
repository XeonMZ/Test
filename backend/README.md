# STMS Backend

Laravel 12 backend untuk SJT Travel Management System, mengikuti DDD + Clean Architecture.

## Booking Engine Flow (Sprint 5B.1)

Booking berjalan melalui endpoint API Sanctum dan seluruh business logic berada di `App\Modules\Booking\Application\Services\BookingService`.

### Booking Flow

1. Customer membuat booking melalui `POST /booking` dengan `schedule_id`, `customer_id`, daftar `seat_ids`, data passenger, dan amount opsional.
2. `BookingValidationService` memvalidasi customer, route, schedule, trip, vehicle, driver, harga, kapasitas, duplicate booking, jadwal belum berangkat, dan ketersediaan seat.
3. `BookingService` menjalankan database transaction, mengambil row schedule/customer dengan `lockForUpdate()`, memvalidasi seat, membuat booking, passenger, dan seat reservation berstatus `locked`.
4. Seat lock memakai nilai system setting `booking.seat_lock_minutes` dengan default 10 menit.
5. `ExpireBookingJob`, `ReleaseExpiredSeatJob`, dan `SendBookingNotificationJob` dikirim ke queue.
6. Saat payment sukses, `confirmBooking()` mengubah booking menjadi `paid`, seat menjadi `confirmed`, lalu mengirim `GenerateTicketJob`.
7. `GenerateTicketJob` membuat ticket dan mengubah lifecycle menjadi `ticket_generated`.

### Booking Lifecycle

`draft -> seat_locked -> waiting_payment -> paid -> ticket_generated -> completed`

Status terminal: `cancelled`, `expired`, `refunded`.

Semua transisi divalidasi oleh `BookingStateMachine`.

### Seat Lock

Seat lock menggunakan:

- Database transaction
- Row lock (`lockForUpdate()`)
- Validasi seat aktif dan belum dikunci/terjual
- Kolom `locked_until` dan `released_at`
- Scheduler setiap menit untuk release otomatis

### Scheduler & Queue

Scheduler di `routes/console.php` menjalankan setiap menit dengan timezone `Asia/Jakarta`:

- `booking:release-expired-seats`
- `booking:expire-due`
- `booking:cleanup-drafts`

Queue jobs:

- `GenerateTicketJob`
- `ExpireBookingJob`
- `ReleaseExpiredSeatJob`
- `SendBookingNotificationJob`

### Endpoint

- `POST /booking`
- `POST /booking/lock-seat`
- `POST /booking/release-seat`
- `POST /booking/cancel`
- `GET /booking/{id}`
- `GET /customer/bookings`

Semua response mengikuti format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```
