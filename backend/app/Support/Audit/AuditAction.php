<?php

namespace App\Support\Audit;

enum AuditAction: string { case Create = 'create'; case Update = 'update'; case Delete = 'delete'; case Login = 'login'; case Logout = 'logout'; case Payment = 'payment'; case Booking = 'booking'; case DriverCheckIn = 'driver_check_in'; }
