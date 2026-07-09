<?php

namespace App\Support\FeatureFlags;

enum FeatureFlagDefinition: string { case Gps = 'gps'; case Membership = 'membership'; case Voucher = 'voucher'; case Backup = 'backup'; case Realtime = 'realtime'; case Qr = 'qr'; case Notifications = 'notifications'; }
