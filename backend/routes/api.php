<?php

use Illuminate\Support\Facades\Route;
use App\Support\Health\HealthController;

Route::get('health', [HealthController::class, 'health']);
Route::get('ready', [HealthController::class, 'ready']);
Route::get('version', [HealthController::class, 'version']);

Route::prefix('installer')->group(function (): void {
    Route::get('status', [\App\Http\Controllers\InstallerController::class, 'status']);
    Route::post('install', [\App\Http\Controllers\InstallerController::class, 'store'])->middleware('throttle:6,1');
});

Route::prefix('catalog')->middleware('throttle:120,1')->group(function (): void {
    Route::get('settings', [\App\Modules\Catalog\Presentation\CatalogController::class, 'publicSettings']);
    Route::get('routes', [\App\Modules\Catalog\Presentation\CatalogController::class, 'routes']);
    Route::get('schedules', [\App\Modules\Catalog\Presentation\CatalogController::class, 'schedules']);
    Route::get('schedules/{schedule}/seats', [\App\Modules\Catalog\Presentation\CatalogController::class, 'seats']);
});

Route::post('login', [\App\Modules\Auth\Presentation\AuthController::class, 'login'])->middleware('throttle:login');
Route::post('register', [\App\Modules\Auth\Presentation\AuthController::class, 'register'])->middleware('throttle:register');
// Password reset is passcode-based. 'otp-request' bounds how many codes an
// address (and a host) can trigger; 'otp-verify' bounds redemption attempts,
// on top of the per-code attempt ceiling enforced inside OtpService.
Route::post('forgot-password', [\App\Modules\Auth\Presentation\AuthController::class, 'forgotPassword'])
    ->middleware(['throttle:password-reset', 'throttle:otp-request']);
Route::post('reset-password', [\App\Modules\Auth\Presentation\AuthController::class, 'resetPassword'])
    ->middleware(['throttle:password-reset', 'throttle:otp-verify']);


Route::prefix('owner/production-readiness')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:owner'])->group(function (): void {
    Route::get('health', [\App\Http\Controllers\ProductionReadinessController::class, 'health']);
    Route::get('demo-data', [\App\Http\Controllers\ProductionReadinessController::class, 'demoData']);
    Route::delete('demo-data', [\App\Http\Controllers\ProductionReadinessController::class, 'deleteDemoData'])->middleware('throttle:6,1');
    Route::get('configuration/export', [\App\Http\Controllers\ProductionReadinessController::class, 'export']);
    Route::post('configuration/import', [\App\Http\Controllers\ProductionReadinessController::class, 'import'])->middleware('throttle:6,1');
    Route::post('configuration/backup', [\App\Http\Controllers\ProductionReadinessController::class, 'backup'])->middleware('throttle:6,1');
    Route::post('configuration/restore', [\App\Http\Controllers\ProductionReadinessController::class, 'restore'])->middleware('throttle:6,1');
    Route::get('backup/download', [\App\Http\Controllers\ProductionReadinessController::class, 'downloadFullBackup'])->middleware('throttle:3,10');

    // Map Provider management (super admin)
    Route::get('map-settings', [\App\Http\Controllers\MapSettingsController::class, 'settings']);
    Route::put('map-settings', [\App\Http\Controllers\MapSettingsController::class, 'update'])->middleware('throttle:30,1');
    Route::post('map-settings/simulator/{action}', [\App\Http\Controllers\MapSettingsController::class, 'simulator'])->middleware('throttle:30,1');
});

Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('logout', [\App\Modules\Auth\Presentation\AuthController::class, 'logout']);
    Route::get('profile', [\App\Modules\Auth\Presentation\AuthController::class, 'profile']);
    Route::put('profile', [\App\Modules\Auth\Presentation\AuthController::class, 'updateProfile']);
    Route::put('change-password', [\App\Modules\Auth\Presentation\AuthController::class, 'changePassword']);
    Route::post('refresh', [\App\Modules\Auth\Presentation\AuthController::class, 'refresh']);
});


Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('booking', [\App\Modules\Booking\Presentation\BookingController::class, 'store'])->middleware(['permission:booking:create', 'verified.email', 'cooldown.customer:travel-booking']);
    Route::post('booking/lock-seat', [\App\Modules\Booking\Presentation\BookingController::class, 'lockSeat'])->middleware('permission:booking:create');
    Route::post('booking/release-seat', [\App\Modules\Booking\Presentation\BookingController::class, 'releaseSeat'])->middleware('permission:booking:create');
    Route::post('booking/cancel', [\App\Modules\Booking\Presentation\BookingController::class, 'cancel'])->middleware('permission:booking:create');
    Route::get('booking/{id}', [\App\Modules\Booking\Presentation\BookingController::class, 'show'])->middleware('permission:ticket:read');
    Route::get('customer/bookings', [\App\Modules\Booking\Presentation\BookingController::class, 'customerBookings'])->middleware('permission:history:read');

    // Tour package booking (end-to-end) — customer
    Route::get('package-bookings', [\App\Http\Controllers\PackageBookingController::class, 'myIndex']);
    Route::post('package-bookings', [\App\Http\Controllers\PackageBookingController::class, 'store'])->middleware(['verified.email', 'cooldown.customer:package-booking']);
    Route::post('package-bookings/{uuid}/pay', [\App\Http\Controllers\PackageBookingController::class, 'pay']);
    Route::post('package-bookings/{uuid}/confirm-transfer', [\App\Http\Controllers\PackageBookingController::class, 'confirmTransfer']);
    // DP settlement (tour packages only).
    Route::post('package-bookings/{uuid}/settle', [\App\Http\Controllers\PackageBookingController::class, 'settle']);
    Route::post('package-bookings/{uuid}/confirm-settlement', [\App\Http\Controllers\PackageBookingController::class, 'confirmSettlement']);
    Route::post('package-bookings/{uuid}/cancel', [\App\Http\Controllers\PackageBookingController::class, 'customerCancel']);

    // Package ratings. Eligibility is re-checked server-side on store(); the
    // eligibility endpoint only exists so the UI never shows a form that
    // would be rejected.
    Route::get('package-ratings/eligibility', [\App\Http\Controllers\PackageRatingController::class, 'eligibility']);
    Route::post('package-ratings', [\App\Http\Controllers\PackageRatingController::class, 'store'])
        ->middleware(['verified.email', 'throttle:10,1']);
});

// Payment gateway webhook stays public by design: it is verified via
// gateway signature inside PaymentWebhookService and rate limited here.
Route::post('v1/payments/webhook', [\App\Modules\Payments\Presentation\PaymentController::class, 'webhook'])->middleware('throttle:60,1');

Route::prefix('v1')->middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('payments', [\App\Modules\Payments\Presentation\PaymentController::class, 'store'])->middleware('throttle:30,1');
    Route::get('payments/{payment}', [\App\Modules\Payments\Presentation\PaymentController::class, 'show']);
    Route::get('tickets', [\App\Modules\Tickets\Presentation\TicketController::class, 'index']);
    Route::get('tickets/{ticket}', [\App\Modules\Tickets\Presentation\TicketController::class, 'show']);
    Route::get('tickets/{ticket}/qr', [\App\Modules\Tickets\Presentation\TicketController::class, 'qr']);
    Route::post('tickets/verify', [\App\Modules\Tickets\Presentation\TicketController::class, 'verify'])->middleware('role:driver,admin,owner');
    Route::post('check-in', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'store'])->middleware('role:driver,admin,owner');
    Route::post('check-in/by-code', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'storeByCode'])->middleware('role:driver,admin,owner');
    Route::post('check-in/no-show', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'noShow'])->middleware('role:driver,admin,owner');
    Route::post('check-in/board', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'board'])->middleware('role:driver,admin,owner');
    Route::get('trips/{trip}/passengers', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'tripPassengers'])->middleware('role:driver,admin,owner');
});

// Public catalog — dynamic home + tour packages (published content only).
Route::prefix('catalog')->middleware('throttle:60,1')->group(function (): void {
    Route::get('home', [\App\Http\Controllers\CmsController::class, 'catalogHome']);
    // Recommendation rail on the customer dashboard. Public so it can be
    // cached at the edge like the rest of the catalog — it carries no
    // per-user data, only published CMS cards.
    Route::get('recommendations', [\App\Http\Controllers\CmsController::class, 'catalogRecommendations']);
    Route::get('hero-slides', [\App\Http\Controllers\CmsController::class, 'catalogHeroSlides']);
    Route::get('branding', [\App\Http\Controllers\CmsController::class, 'branding']);
    Route::get('tour-packages', [\App\Http\Controllers\CmsController::class, 'catalogPackages']);
    Route::get('tour-packages/{slug}', [\App\Http\Controllers\CmsController::class, 'catalogPackageShow']);
    // Public review list for one package (names shortened server-side).
    Route::get('tour-packages/{slug}/ratings', [\App\Http\Controllers\PackageRatingController::class, 'index']);
    // Legal pages (published only) — consumed by the public legal routes.
    Route::get('legal', [\App\Http\Controllers\LegalController::class, 'index']);
    Route::get('legal/{slug}', [\App\Http\Controllers\LegalController::class, 'show']);
    // Editable company profile / structured site copy.
    Route::get('site-content/{slug}', [\App\Http\Controllers\SiteContentController::class, 'show']);
});

// Legacy signed verification link. Nothing issues these any more (verification
// moved to passcodes); the route stays so links already delivered before the
// rollout still work, and can be removed once they have all expired.
Route::get('email/verify/{id}/{hash}', [\App\Http\Controllers\EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:12,1'])->name('verification.verify');

// Notifications are per-user and available to every authenticated role.
Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('email/verification-notification', [\App\Http\Controllers\EmailVerificationController::class, 'send'])
        ->middleware(['throttle:3,10', 'throttle:otp-request']);
    Route::post('email/verify-otp', [\App\Http\Controllers\EmailVerificationController::class, 'confirm'])
        ->middleware('throttle:otp-verify');
    // Map Provider resolution — every map page (all roles) reads this.
    Route::get('map/config', [\App\Http\Controllers\MapSettingsController::class, 'config']);
    Route::get('notifications', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'notifications']);
    Route::post('notifications/{notification}/read', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'markNotificationRead']);
    Route::post('notifications/{notification}/unread', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'markNotificationUnread']);
    Route::post('notifications/read-all', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'markAllNotificationsRead']);
    Route::delete('notifications/{notification}', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'destroyNotification']);
});

Route::prefix('customer')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:customer,admin,owner'])->group(function (): void {
    Route::get('promos', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'promos']);
    Route::get('promos/{promo}', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'promoShow']);
    Route::get('membership', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'membership']);
    Route::get('bookings/{booking}/tracking', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'tracking'])->middleware('throttle:120,1');
    // Live Trip Tracking — Gojek-style map payload (own booking, active trip only)
    Route::get('bookings/{booking}/track-live', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'customerTrack'])->middleware('throttle:120,1');
    Route::post('bookings/{booking}/rate-driver', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'rateDriver']);
    Route::post('promos/validate', [\App\Modules\Customers\Presentation\CustomerPortalController::class, 'validatePromo']);
});

Route::prefix('owner')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:owner'])->group(function (): void {
    Route::get('analytics', [\App\Modules\Owner\Presentation\OwnerController::class, 'analytics']);
    Route::get('revenue', [\App\Modules\Owner\Presentation\OwnerController::class, 'revenue']);
    Route::get('feature-flags', [\App\Modules\Owner\Presentation\OwnerController::class, 'featureFlags']);
    Route::patch('feature-flags', [\App\Modules\Owner\Presentation\OwnerController::class, 'toggleFeatureFlag'])->middleware('throttle:30,1');
});

Route::prefix('v1')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:driver'])->group(function (): void {
    Route::get('driver/dashboard', [\App\Modules\Drivers\Presentation\DriverController::class, 'dashboard']);
    Route::get('driver/trips', [\App\Modules\Drivers\Presentation\DriverController::class, 'trips']);
    Route::get('driver/history', [\App\Modules\Drivers\Presentation\DriverController::class, 'history']);
    Route::get('driver/earnings', [\App\Modules\Drivers\Presentation\DriverController::class, 'earnings']);
    Route::get('driver/timeline', [\App\Modules\Drivers\Presentation\DriverController::class, 'timeline']);
    Route::post('driver/start-shift', [\App\Modules\Drivers\Presentation\DriverController::class, 'startShift']);
    Route::post('driver/end-shift', [\App\Modules\Drivers\Presentation\DriverController::class, 'endShift']);
    Route::post('driver/break', [\App\Modules\Drivers\Presentation\DriverController::class, 'break']);
    Route::post('driver/resume', [\App\Modules\Drivers\Presentation\DriverController::class, 'resume']);
    Route::post('driver/start-trip', [\App\Modules\Drivers\Presentation\DriverController::class, 'startTrip']);
    Route::post('driver/finish-trip', [\App\Modules\Drivers\Presentation\DriverController::class, 'finishTrip']);
    Route::post('driver/location', [\App\Modules\Drivers\Presentation\DriverController::class, 'location'])->middleware('throttle:12,1');
    // Live Trip Tracking — driver manifest + passenger progress
    Route::get('driver/trips/{tripId}/manifest', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'driverManifest'])->whereNumber('tripId');
    Route::post('driver/trips/{tripId}/bookings/{bookingId}/pickup', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'pickupBooking'])->whereNumber('tripId')->whereNumber('bookingId');
    Route::post('driver/trips/{tripId}/bookings/{bookingId}/dropoff', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'dropoffBooking'])->whereNumber('tripId')->whereNumber('bookingId');
    Route::get('driver/jastip', [\App\Modules\Admin\Presentation\JastipController::class, 'forDriver']);
    Route::post('driver/jastip/{id}/status', [\App\Modules\Admin\Presentation\JastipController::class, 'driverUpdateStatus']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:admin,owner'])->group(function (): void {
    Route::get('customers', [\App\Modules\Admin\Presentation\AdminController::class, 'customers']);
    Route::delete('customers/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'customerDestroy'])->whereNumber('id');
    // Promo management (full CRUD)
    Route::get('promos', [\App\Modules\Admin\Presentation\AdminController::class, 'promoIndex']);
    Route::post('promos', [\App\Modules\Admin\Presentation\AdminController::class, 'promoStore']);
    Route::patch('promos/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'promoUpdate'])->whereNumber('id');
    Route::delete('promos/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'promoDestroy'])->whereNumber('id');
    // Tour package booking management (admin & owner)
    Route::get('package-bookings', [\App\Http\Controllers\PackageBookingController::class, 'adminIndex']);
    Route::post('package-bookings/{id}/verify', [\App\Http\Controllers\PackageBookingController::class, 'verify'])->whereNumber('id');
    Route::post('package-bookings/{id}/verify-settlement', [\App\Http\Controllers\PackageBookingController::class, 'verifySettlement'])->whereNumber('id');
    Route::post('package-bookings/{id}/reject', [\App\Http\Controllers\PackageBookingController::class, 'reject'])->whereNumber('id');
    Route::post('package-bookings/{id}/{action}', [\App\Http\Controllers\PackageBookingController::class, 'adminTransition'])->whereNumber('id')->where('action', 'complete|cancel');
    // Email template editor (admin & owner)
    Route::get('email-templates', [\App\Http\Controllers\EmailTemplateController::class, 'index']);
    Route::put('email-templates', [\App\Http\Controllers\EmailTemplateController::class, 'update']);
    Route::post('email-templates/preview', [\App\Http\Controllers\EmailTemplateController::class, 'preview']);
    // Tour Package CMS + Home/Content CMS (admin & owner)
    Route::get('tour-packages', [\App\Http\Controllers\CmsController::class, 'packages']);
    Route::post('tour-packages', [\App\Http\Controllers\CmsController::class, 'packageStore']);
    Route::patch('tour-packages/{id}', [\App\Http\Controllers\CmsController::class, 'packageUpdate'])->whereNumber('id');
    Route::delete('tour-packages/{id}', [\App\Http\Controllers\CmsController::class, 'packageDestroy'])->whereNumber('id');
    Route::get('cms-sections', [\App\Http\Controllers\CmsController::class, 'sections']);
    Route::post('cms-sections', [\App\Http\Controllers\CmsController::class, 'sectionStore']);
    Route::patch('cms-sections/{id}', [\App\Http\Controllers\CmsController::class, 'sectionUpdate'])->whereNumber('id');
    Route::delete('cms-sections/{id}', [\App\Http\Controllers\CmsController::class, 'sectionDestroy'])->whereNumber('id');
    // Centralized CMS: branding, versions, upload
    Route::get('cms/branding', [\App\Http\Controllers\CmsController::class, 'branding']);
    Route::put('cms/branding', [\App\Http\Controllers\CmsController::class, 'brandingUpdate']);
    Route::get('cms/versions', [\App\Http\Controllers\CmsController::class, 'versions']);
    Route::post('cms/versions', [\App\Http\Controllers\CmsController::class, 'saveVersion']);
    Route::post('cms/versions/{id}/restore', [\App\Http\Controllers\CmsController::class, 'restoreVersion'])->whereNumber('id');
    Route::post('cms/upload', [\App\Http\Controllers\CmsController::class, 'upload'])->middleware('throttle:30,1');
    // Legal pages CMS (admin & owner) — sanitized on write, audit-trailed.
    Route::get('legal', [\App\Http\Controllers\LegalController::class, 'adminIndex']);
    Route::get('legal/{slug}', [\App\Http\Controllers\LegalController::class, 'adminShow']);
    Route::put('legal/{slug}', [\App\Http\Controllers\LegalController::class, 'adminUpdate'])->middleware('throttle:60,1');
    // Company profile CMS (admin & owner) — sanitized on write, audit-trailed.
    Route::get('site-content/{slug}', [\App\Http\Controllers\SiteContentController::class, 'adminShow']);
    Route::put('site-content/{slug}', [\App\Http\Controllers\SiteContentController::class, 'adminUpdate'])->middleware('throttle:60,1');
    Route::get('customers/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'customerShow']);
    Route::patch('customers/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'customerUpdate']);

    Route::get('drivers', [\App\Modules\Admin\Presentation\AdminController::class, 'drivers']);
    Route::get('drivers/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'driverShow']);
    Route::patch('drivers/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'driverUpdate']);

    Route::get('vehicles', [\App\Modules\Admin\Presentation\AdminController::class, 'vehicles']);
    Route::post('vehicles', [\App\Modules\Admin\Presentation\AdminController::class, 'vehicleStore']);
    Route::get('vehicles/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'vehicleShow']);
    Route::patch('vehicles/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'vehicleUpdate']);

    Route::get('bookings', [\App\Modules\Admin\Presentation\AdminController::class, 'bookings']);
    Route::get('bookings/schedules', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingSchedules']);
    Route::get('bookings/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingShow'])->whereNumber('id');
    Route::patch('bookings/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingUpdate'])->whereNumber('id');
    Route::post('bookings/{id}/cancel', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingCancel']);

    Route::get('payments', [\App\Modules\Admin\Presentation\AdminController::class, 'payments']);
    Route::get('payments/schedules', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentSchedules']);
    Route::get('payments/export', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentsExport'])->middleware('throttle:12,1');
    Route::get('payments/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentShow'])->whereNumber('id');
    Route::post('payments/{id}/mark-failed', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentMarkFailed']);
    Route::post('payments/{id}/verify', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentVerify'])->middleware('throttle:30,1');
    Route::post('payments/{id}/refund', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentRefund'])->middleware('throttle:12,1');

    Route::get('tickets', [\App\Modules\Admin\Presentation\AdminController::class, 'tickets']);
    Route::get('operations', [\App\Modules\Admin\Presentation\AdminController::class, 'operations']);

    Route::get('notifications', [\App\Modules\Admin\Presentation\AdminController::class, 'notifications']);
    Route::post('notifications', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationStore']);
    Route::post('notifications/broadcast', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationBroadcast']);
    Route::get('notifications/broadcasts', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationBroadcasts']);
    // Notification Center — activity-grouped view (one row per send activity)
    Route::get('notifications/activities', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivities']);
    Route::post('notifications/activities', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivityStore']);
    Route::get('notifications/activities/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivityShow'])->whereNumber('id');
    Route::patch('notifications/activities/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivityUpdate'])->whereNumber('id');
    Route::delete('notifications/activities/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivityDestroy'])->whereNumber('id');
    Route::post('notifications/activities/{id}/send', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivitySend'])->whereNumber('id');
    Route::get('notifications/activities/{id}/recipients', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationActivityRecipients'])->whereNumber('id');

    Route::get('reports', [\App\Modules\Admin\Presentation\AdminController::class, 'reports']);
    Route::get('reports/export', [\App\Modules\Admin\Presentation\AdminController::class, 'reportsExport'])->middleware('throttle:12,1');
    Route::get('reports/activity-logs', [\App\Modules\Admin\Presentation\AdminController::class, 'activityLogs']);
    Route::get('reports/activity-logs/export', [\App\Modules\Admin\Presentation\AdminController::class, 'activityLogsExport'])->middleware('throttle:12,1');

    Route::get('settings', [\App\Modules\Admin\Presentation\AdminController::class, 'settings']);
    Route::put('settings', [\App\Modules\Admin\Presentation\AdminController::class, 'settingsUpdate']);
    Route::post('settings/upload', [\App\Modules\Admin\Presentation\AdminController::class, 'settingsUpload'])->middleware('throttle:20,1');

    // ----- Operational management (routes, schedules, pricing, seats) -----
    Route::get('manage/form-options', [\App\Modules\Admin\Presentation\ManagementController::class, 'formOptions']);

    Route::get('manage/routes', [\App\Modules\Admin\Presentation\ManagementController::class, 'routes']);
    Route::post('manage/routes', [\App\Modules\Admin\Presentation\ManagementController::class, 'routeStore']);
    Route::patch('manage/routes/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'routeUpdate']);
    Route::delete('manage/routes/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'routeDestroy']);

    Route::get('manage/schedules', [\App\Modules\Admin\Presentation\ManagementController::class, 'schedules']);
    // Live Trip Monitoring (read-only) + realtime dashboard summary
    Route::get('live/summary', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'liveSummary']);
    Route::get('live/schedules/{scheduleId}', [\App\Modules\Drivers\Presentation\LiveTripController::class, 'scheduleLive'])->whereNumber('scheduleId');
    Route::post('manage/schedules', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleStore']);
    Route::patch('manage/schedules/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleUpdate']);
    Route::post('manage/schedules/{id}/cancel', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleCancel']);

    Route::get('manage/pricing', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingRules']);
    Route::post('manage/pricing', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingStore']);
    Route::patch('manage/pricing/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingUpdate']);
    Route::delete('manage/pricing/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingDestroy']);


    // ----- Fleet (add vehicles) & full-custom seat layout builder -----
    Route::get('manage/vehicles', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicles']);
    Route::post('manage/vehicles', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleStore']);
    Route::get('manage/vehicles/{vehicle}/layout', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatsMap']);
    Route::put('manage/vehicles/{vehicle}/layout', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatsLayout']);

    // ----- Staff & driver management (owner adds admins; owner/admin add drivers) -----
    Route::get('manage/admins', [\App\Modules\Admin\Presentation\UserManagementController::class, 'admins']);
    Route::post('manage/admins', [\App\Modules\Admin\Presentation\UserManagementController::class, 'adminStore']);
    Route::post('manage/admins/{id}/reset-password', [\App\Modules\Admin\Presentation\UserManagementController::class, 'adminResetPassword'])->middleware('throttle:12,1');
    Route::delete('manage/admins/{id}', [\App\Modules\Admin\Presentation\UserManagementController::class, 'adminDestroy']);
    Route::get('manage/drivers', [\App\Modules\Admin\Presentation\UserManagementController::class, 'drivers']);
    Route::post('manage/drivers', [\App\Modules\Admin\Presentation\UserManagementController::class, 'driverStore']);
    Route::patch('manage/drivers/{id}', [\App\Modules\Admin\Presentation\UserManagementController::class, 'driverUpdate']);
    Route::post('manage/drivers/{id}/photo', [\App\Modules\Admin\Presentation\UserManagementController::class, 'driverPhoto']);
    Route::get('manage/drivers/{id}/ratings', [\App\Modules\Admin\Presentation\UserManagementController::class, 'driverRatings']);

    // ----- Jastip (package delivery) management (#10) -----
    Route::get('manage/jastip', [\App\Modules\Admin\Presentation\JastipController::class, 'index']);
    Route::post('manage/jastip', [\App\Modules\Admin\Presentation\JastipController::class, 'store']);
    Route::patch('manage/jastip/{id}', [\App\Modules\Admin\Presentation\JastipController::class, 'update']);
    Route::delete('manage/jastip/{id}', [\App\Modules\Admin\Presentation\JastipController::class, 'destroy']);
});
