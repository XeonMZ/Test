<?php

namespace App\Support\Enums;

enum UserRole: string { case Guest = 'guest'; case Customer = 'customer'; case Driver = 'driver'; case Admin = 'admin'; case Owner = 'owner'; }
