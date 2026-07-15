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
    // Customer service & jastip WhatsApp (#5, #10)
    case CsWhatsApp = 'cs_whatsapp';
    case JastipWhatsApp = 'jastip_whatsapp';
    // Social media links (#11)
    case SocialInstagram = 'social_instagram';
    case SocialTiktok = 'social_tiktok';
    case SocialFacebook = 'social_facebook';
    // Admin welcome/notification banner (#9)
    case WelcomeNotice = 'welcome_notice';
}
