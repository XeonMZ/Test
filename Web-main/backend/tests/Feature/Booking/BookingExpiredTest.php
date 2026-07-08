<?php

declare(strict_types=1);

namespace Tests\Feature\Booking;

use App\Jobs\ExpireBookingJob;
use Tests\TestCase;

final class BookingExpiredTest extends TestCase
{
    public function test_expire_booking_job_is_queue_ready(): void
    {
        self::assertTrue(is_subclass_of(ExpireBookingJob::class, \Illuminate\Contracts\Queue\ShouldQueue::class));
    }
}
