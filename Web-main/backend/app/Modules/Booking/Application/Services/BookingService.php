<?php

declare(strict_types=1);

namespace App\Modules\Booking\Application\Services;

use App\Jobs\ExpireBookingJob;
use App\Jobs\GenerateTicketJob;
use App\Jobs\ReleaseExpiredSeatJob;
use App\Jobs\SendBookingNotificationJob;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Passenger;
use App\Models\Schedule;
use App\Models\SeatReservation;
use App\Models\SystemSetting;
use App\Modules\Booking\Application\StateMachines\BookingStateMachine;
use App\Modules\Booking\Domain\Events\BookingCancelled;
use App\Modules\Booking\Domain\Events\BookingCreated;
use App\Modules\Booking\Domain\Events\BookingExpired;
use App\Modules\Booking\Domain\Events\BookingPaid;
use App\Modules\Booking\Domain\Events\SeatLocked;
use App\Modules\Booking\Domain\Events\SeatReleased;
use App\Modules\Booking\Domain\Repositories\BookingRepository;
use App\Modules\Booking\Domain\ValueObjects\BookingStatus;
use App\Support\Exceptions\BookingException;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

final class BookingService
{
    public function __construct(
        private readonly BookingRepository $bookings,
        private readonly BookingValidationService $validator,
        private readonly BookingStateMachine $states,
        private readonly DatabaseManager $db,
    ) {}

    public function createBooking(array $data): Booking
    {
        return $this->db->transaction(function () use ($data): Booking {
            $now = now();
            $lockMinutes = $this->seatLockMinutes();
            $customer = Customer::query()->lockForUpdate()->findOrFail($data['customer_id']);
            $schedule = Schedule::with(['route', 'vehicle.layout', 'vehicle.seats', 'driver.user', 'trip'])->lockForUpdate()->findOrFail($data['schedule_id']);
            $seatIds = array_map('intval', $data['seat_ids'] ?? []);
            $amount = (float) ($data['amount'] ?? $schedule->base_fare * max(1, count($seatIds)));
            $this->validator->validateCreate($customer, $schedule, $seatIds, $amount);
            $this->validator->assertSeatsAvailable($schedule, $seatIds, $now);
            $booking = Booking::create(['code' => 'BKG-'.Str::upper(Str::random(10)), 'schedule_id' => $schedule->id, 'customer_id' => $customer->id, 'status' => BookingStatus::SeatLocked->value, 'amount' => $amount, 'expires_at' => $now->copy()->addMinutes($lockMinutes)]);
            foreach (($data['passengers'] ?? []) as $index => $passengerData) {
                $passenger = Passenger::create(['booking_id' => $booking->id, 'name' => $passengerData['name'], 'identity_number' => $passengerData['identity_number'] ?? 'NIK-'.$booking->id.'-'.$index]);
                SeatReservation::create(['booking_id' => $booking->id, 'passenger_id' => $passenger->id, 'vehicle_seat_id' => $seatIds[$index] ?? $seatIds[0], 'status' => 'locked', 'locked_until' => $booking->expires_at]);
            }
            BookingCreated::dispatch($booking->fresh());
            SeatLocked::dispatch($booking->fresh());
            $this->log($booking, 'booking.created');
            $this->log($booking, 'seat.locked');
            ExpireBookingJob::dispatch($booking->uuid)->delay($booking->expires_at);
            ReleaseExpiredSeatJob::dispatch($booking->uuid)->delay($booking->expires_at);
            SendBookingNotificationJob::dispatch($booking->uuid, 'created');
            return $this->getBooking($booking->uuid);
        });
    }

    public function lockSeat(string $bookingUuid, array $seatIds): Booking
    {
        return $this->db->transaction(function () use ($bookingUuid, $seatIds): Booking {
            $booking = Booking::with(['schedule.vehicle.layout', 'schedule.route', 'schedule.driver', 'customer'])->where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            $this->states->assertCanTransition(BookingStatus::from($booking->status), BookingStatus::SeatLocked);
            $this->validator->assertSeatsAvailable($booking->schedule, array_map('intval', $seatIds), now());
            $booking->update(['status' => BookingStatus::SeatLocked->value, 'expires_at' => now()->addMinutes($this->seatLockMinutes())]);
            foreach ($booking->passengers as $index => $passenger) {
                SeatReservation::create(['booking_id' => $booking->id, 'passenger_id' => $passenger->id, 'vehicle_seat_id' => $seatIds[$index] ?? $seatIds[0], 'status' => 'locked', 'locked_until' => $booking->expires_at]);
            }
            SeatLocked::dispatch($booking->fresh());
            $this->log($booking, 'seat.locked');
            return $this->getBooking($bookingUuid);
        });
    }

    public function releaseSeat(string $bookingUuid): Booking
    {
        return $this->db->transaction(function () use ($bookingUuid): Booking {
            $booking = Booking::where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            $booking->seatReservations()->whereIn('status', ['locked', 'waiting_payment'])->update(['status' => 'released', 'released_at' => now()]);
            SeatReleased::dispatch($booking->fresh());
            $this->log($booking, 'seat.released');
            return $this->getBooking($bookingUuid);
        });
    }

    public function confirmBooking(string $bookingUuid): Booking
    {
        return $this->db->transaction(function () use ($bookingUuid): Booking {
            $booking = Booking::where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            $current = BookingStatus::from($booking->status);
            if ($current === BookingStatus::SeatLocked) {
                $this->states->assertCanTransition($current, BookingStatus::WaitingPayment);
                $booking->status = BookingStatus::WaitingPayment->value;
                $current = BookingStatus::WaitingPayment;
            }
            $this->states->assertCanTransition($current, BookingStatus::Paid);
            $booking->update(['status' => BookingStatus::Paid->value, 'paid_at' => now()]);
            $booking->seatReservations()->where('status', 'locked')->update(['status' => 'confirmed']);
            BookingPaid::dispatch($booking->fresh());
            $this->log($booking, 'booking.paid');
            GenerateTicketJob::dispatch($booking->uuid);
            SendBookingNotificationJob::dispatch($booking->uuid, 'paid');
            return $this->getBooking($bookingUuid);
        });
    }

    public function cancelBooking(string $bookingUuid): Booking
    {
        return $this->transitionToTerminal($bookingUuid, BookingStatus::Cancelled, BookingCancelled::class, 'booking.cancelled');
    }

    public function expireBooking(string $bookingUuid): Booking
    {
        return $this->transitionToTerminal($bookingUuid, BookingStatus::Expired, BookingExpired::class, 'booking.expired');
    }

    public function expireDueBookings(): int
    {
        $count = 0;
        Booking::whereIn('status', [BookingStatus::SeatLocked->value, BookingStatus::WaitingPayment->value])->where('expires_at', '<=', now())->pluck('uuid')->each(function (string $uuid) use (&$count): void { $this->expireBooking($uuid); $count++; });
        return $count;
    }

    public function cleanupDrafts(): int
    {
        return Booking::where('status', BookingStatus::Draft->value)->where('created_at', '<=', now()->subMinutes($this->seatLockMinutes()))->update(['status' => BookingStatus::Expired->value, 'expires_at' => now()]);
    }

    public function getBooking(string|int $id): Booking
    {
        $booking = is_numeric($id) ? $this->bookings->findById((int) $id) : $this->bookings->findByUuid((string) $id);
        if (!$booking) { throw new BookingException('Booking tidak ditemukan.'); }
        return $booking;
    }

    public function getCustomerBookings(int $customerId): mixed
    {
        return $this->bookings->customerBookings($customerId);
    }

    private function transitionToTerminal(string $bookingUuid, BookingStatus $status, string $eventClass, string $action): Booking
    {
        return $this->db->transaction(function () use ($bookingUuid, $status, $eventClass, $action): Booking {
            $booking = Booking::where('uuid', $bookingUuid)->lockForUpdate()->firstOrFail();
            if (!in_array($booking->status, [BookingStatus::Draft->value, BookingStatus::SeatLocked->value, BookingStatus::WaitingPayment->value], true)) {
                return $this->getBooking($bookingUuid);
            }
            $this->states->assertCanTransition(BookingStatus::from($booking->status), $status);
            $booking->update(['status' => $status->value, 'cancelled_at' => $status === BookingStatus::Cancelled ? now() : $booking->cancelled_at]);
            $booking->seatReservations()->whereIn('status', ['locked', 'waiting_payment'])->update(['status' => 'released', 'released_at' => now()]);
            $eventClass::dispatch($booking->fresh());
            SeatReleased::dispatch($booking->fresh());
            $this->log($booking, $action);
            SendBookingNotificationJob::dispatch($booking->uuid, $status === BookingStatus::Expired ? 'expired' : 'cancelled');
            return $this->getBooking($bookingUuid);
        });
    }

    private function seatLockMinutes(): int
    {
        $setting = SystemSetting::where('key', 'booking.seat_lock_minutes')->first();
        return max(1, (int) ($setting?->value ?? 10));
    }

    private function log(Booking $booking, string $action): void
    {
        ActivityLog::create(['action' => $action, 'subject_type' => Booking::class, 'subject_id' => $booking->id, 'metadata' => ['booking_uuid' => $booking->uuid]]);
    }
}
