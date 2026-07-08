<?php

namespace App\Support\Settings;

enum SettingKey: string
{
    case SeatLockMinutes = 'seat_lock_minutes';
    case PaymentTimeoutMinutes = 'payment_timeout_minutes';
    case GpsIntervalSeconds = 'gps_interval_seconds';
    case CompanyName = 'company_name';
    case WhatsAppNumber = 'whatsapp_number';
    case Currency = 'currency';
    case BackupEnabled = 'backup_enabled';
    case MaintenanceMode = 'maintenance_mode';
}
