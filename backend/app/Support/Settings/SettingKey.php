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
    case SocialYoutube = 'social_youtube';
    case SocialX = 'social_x';
    /**
     * Down payment for TOUR PACKAGES only.
     *
     * Travel bookings have their own independent DP switch
     * (`payment_dp_enabled`) inside PaymentService. Keeping the two separate
     * is the point: enabling DP for packages must not turn it on for seat
     * bookings.
     */
    case PackageDpEnabled = 'package_dp_enabled';
    case PackageDpPercent = 'package_dp_percent';

    // Admin welcome/notification banner (#9)
    case WelcomeNotice = 'welcome_notice';

    /**
     * Welcome POP-UP — the modal shown once per browser session on the
     * public site. Deliberately distinct from the welcome NOTIFICATION
     * below: one is a marketing interruption every visitor sees, the other
     * is a durable inbox item created once when an account is registered.
     * Sharing keys between them would mean editing one to silence the other.
     */
    case WelcomePopupEnabled = 'welcome_popup_enabled';
    case WelcomePopupTitle = 'welcome_popup_title';
    case WelcomePopupBody = 'welcome_popup_body';
    case WelcomePopupImage = 'welcome_popup_image';

    /** Welcome NOTIFICATION — the in-app inbox entry created at registration. */
    case WelcomeNotificationEnabled = 'welcome_notification_enabled';
    case WelcomeNotificationTitle = 'welcome_notification_title';
    case WelcomeNotificationBody = 'welcome_notification_body';
    // Company profile shown on the public Contact page (legal system)
    case CompanyAddress = 'company_address';
    case CompanyEmail = 'company_email';
    case CompanyPhone = 'company_phone';
    case CompanyHours = 'company_hours';
    case CompanyMapsEmbed = 'company_maps_embed';
}
