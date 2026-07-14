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
Route::post('forgot-password', [\App\Modules\Auth\Presentation\AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
Route::post('reset-password', [\App\Modules\Auth\Presentation\AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');


Route::prefix('owner/production-readiness')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:owner'])->group(function (): void {
    Route::get('health', [\App\Http\Controllers\ProductionReadinessController::class, 'health']);
    Route::get('demo-data', [\App\Http\Controllers\ProductionReadinessController::class, 'demoData']);
    Route::delete('demo-data', [\App\Http\Controllers\ProductionReadinessController::class, 'deleteDemoData'])->middleware('throttle:6,1');
    Route::get('configuration/export', [\App\Http\Controllers\ProductionReadinessController::class, 'export']);
    Route::post('configuration/import', [\App\Http\Controllers\ProductionReadinessController::class, 'import'])->middleware('throttle:6,1');
    Route::post('configuration/backup', [\App\Http\Controllers\ProductionReadinessController::class, 'backup'])->middleware('throttle:6,1');
    Route::post('configuration/restore', [\App\Http\Controllers\ProductionReadinessController::class, 'restore'])->middleware('throttle:6,1');
});

Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('logout', [\App\Modules\Auth\Presentation\AuthController::class, 'logout']);
    Route::get('profile', [\App\Modules\Auth\Presentation\AuthController::class, 'profile']);
    Route::put('profile', [\App\Modules\Auth\Presentation\AuthController::class, 'updateProfile']);
    Route::put('change-password', [\App\Modules\Auth\Presentation\AuthController::class, 'changePassword']);
    Route::post('refresh', [\App\Modules\Auth\Presentation\AuthController::class, 'refresh']);
});


Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::post('booking', [\App\Modules\Booking\Presentation\BookingController::class, 'store'])->middleware('permission:booking:create');
    Route::post('booking/lock-seat', [\App\Modules\Booking\Presentation\BookingController::class, 'lockSeat'])->middleware('permission:booking:create');
    Route::post('booking/release-seat', [\App\Modules\Booking\Presentation\BookingController::class, 'releaseSeat'])->middleware('permission:booking:create');
    Route::post('booking/cancel', [\App\Modules\Booking\Presentation\BookingController::class, 'cancel'])->middleware('permission:booking:create');
    Route::get('booking/{id}', [\App\Modules\Booking\Presentation\BookingController::class, 'show'])->middleware('permission:ticket:read');
    Route::get('customer/bookings', [\App\Modules\Booking\Presentation\BookingController::class, 'customerBookings'])->middleware('permission:history:read');
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

// Notifications are per-user and available to every authenticated role.
Route::middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
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
    Route::post('driver/location', [\App\Modules\Drivers\Presentation\DriverController::class, 'location']);
    Route::get('driver/jastip', [\App\Modules\Admin\Presentation\JastipController::class, 'forDriver']);
    Route::post('driver/jastip/{id}/status', [\App\Modules\Admin\Presentation\JastipController::class, 'driverUpdateStatus']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'maintenance', 'role:admin,owner'])->group(function (): void {
    Route::get('customers', [\App\Modules\Admin\Presentation\AdminController::class, 'customers']);
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
    Route::get('bookings/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingShow']);
    Route::post('bookings/{id}/cancel', [\App\Modules\Admin\Presentation\AdminController::class, 'bookingCancel']);

    Route::get('payments', [\App\Modules\Admin\Presentation\AdminController::class, 'payments']);
    Route::get('payments/{id}', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentShow']);
    Route::post('payments/{id}/mark-failed', [\App\Modules\Admin\Presentation\AdminController::class, 'paymentMarkFailed']);

    Route::get('tickets', [\App\Modules\Admin\Presentation\AdminController::class, 'tickets']);
    Route::get('operations', [\App\Modules\Admin\Presentation\AdminController::class, 'operations']);

    Route::get('notifications', [\App\Modules\Admin\Presentation\AdminController::class, 'notifications']);
    Route::post('notifications/broadcast', [\App\Modules\Admin\Presentation\AdminController::class, 'notificationBroadcast']);

    Route::get('reports', [\App\Modules\Admin\Presentation\AdminController::class, 'reports']);
    Route::get('reports/activity-logs', [\App\Modules\Admin\Presentation\AdminController::class, 'activityLogs']);

    Route::get('settings', [\App\Modules\Admin\Presentation\AdminController::class, 'settings']);
    Route::put('settings', [\App\Modules\Admin\Presentation\AdminController::class, 'settingsUpdate']);

    // ----- Operational management (routes, schedules, pricing, seats) -----
    Route::get('manage/form-options', [\App\Modules\Admin\Presentation\ManagementController::class, 'formOptions']);

    Route::get('manage/routes', [\App\Modules\Admin\Presentation\ManagementController::class, 'routes']);
    Route::post('manage/routes', [\App\Modules\Admin\Presentation\ManagementController::class, 'routeStore']);
    Route::patch('manage/routes/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'routeUpdate']);

    Route::get('manage/schedules', [\App\Modules\Admin\Presentation\ManagementController::class, 'schedules']);
    Route::post('manage/schedules', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleStore']);
    Route::patch('manage/schedules/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleUpdate']);
    Route::post('manage/schedules/{id}/cancel', [\App\Modules\Admin\Presentation\ManagementController::class, 'scheduleCancel']);

    Route::get('manage/pricing', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingRules']);
    Route::post('manage/pricing', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingStore']);
    Route::patch('manage/pricing/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingUpdate']);
    Route::delete('manage/pricing/{id}', [\App\Modules\Admin\Presentation\ManagementController::class, 'pricingDestroy']);

    Route::get('manage/vehicles/{vehicle}/seats', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeats']);
    Route::post('manage/vehicles/{vehicle}/seats/generate', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatsGenerate']);
    Route::patch('manage/vehicles/{vehicle}/seats/{seat}', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatUpdate']);

    // ----- Fleet (add vehicles) & full-custom seat layout builder -----
    Route::get('manage/vehicles', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicles']);
    Route::post('manage/vehicles', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleStore']);
    Route::get('manage/vehicles/{vehicle}/layout', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatsMap']);
    Route::put('manage/vehicles/{vehicle}/layout', [\App\Modules\Admin\Presentation\ManagementController::class, 'vehicleSeatsLayout']);

    // ----- Staff & driver management (owner adds admins; owner/admin add drivers) -----
    Route::get('manage/admins', [\App\Modules\Admin\Presentation\UserManagementController::class, 'admins']);
    Route::post('manage/admins', [\App\Modules\Admin\Presentation\UserManagementController::class, 'adminStore']);
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
