<?php

namespace App\Support\Enums;

enum DriverStatus: string { case Available = 'available'; case Assigned = 'assigned'; case OffDuty = 'off_duty'; case Suspended = 'suspended'; }
