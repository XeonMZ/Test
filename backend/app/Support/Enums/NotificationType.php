<?php

namespace App\Support\Enums;

enum NotificationType: string { case Booking = 'booking'; case Payment = 'payment'; case Ticket = 'ticket'; case Driver = 'driver'; case System = 'system'; }
