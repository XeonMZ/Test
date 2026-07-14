<?php

namespace App\Modules\Payments\Domain\ValueObjects;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Failed = 'failed';
    case Expired = 'expired';
    case Refunded = 'refunded';
    case PartialRefunded = 'partial_refunded';
}
