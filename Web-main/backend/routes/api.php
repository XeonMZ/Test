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
    Route::get('profile', [\App\Modules\Auth\Presentation\AuthController::class, 'profile'])->middleware('verified');
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

Route::prefix('v1')->group(function (): void {
    Route::post('payments', [\App\Modules\Payments\Presentation\PaymentController::class, 'store']);
    Route::get('payments/{payment}', [\App\Modules\Payments\Presentation\PaymentController::class, 'show']);
    Route::post('payments/webhook', [\App\Modules\Payments\Presentation\PaymentController::class, 'webhook']);
    Route::get('tickets', [\App\Modules\Tickets\Presentation\TicketController::class, 'index']);
    Route::get('tickets/{ticket}', [\App\Modules\Tickets\Presentation\TicketController::class, 'show']);
    Route::get('tickets/{ticket}/qr', [\App\Modules\Tickets\Presentation\TicketController::class, 'qr']);
    Route::post('tickets/verify', [\App\Modules\Tickets\Presentation\TicketController::class, 'verify']);
    Route::post('check-in', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'store']);
    Route::post('check-in/no-show', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'noShow']);
    Route::post('check-in/board', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'board']);
    Route::get('trips/{trip}/passengers', [\App\Modules\CheckIn\Presentation\CheckInController::class, 'tripPassengers']);
});

Route::prefix('v1')->middleware(['auth:sanctum', 'active', 'maintenance'])->group(function (): void {
    Route::get('driver/dashboard', [\App\Modules\Drivers\Presentation\DriverController::class, 'dashboard']);
    Route::get('driver/trips', [\App\Modules\Drivers\Presentation\DriverController::class, 'trips']);
    Route::get('driver/history', [\App\Modules\Drivers\Presentation\DriverController::class, 'history']);
    Route::get('driver/earnings', [\App\Modules\Drivers\Presentation\DriverController::class, 'earnings']);
    Route::get('driver/timeline', [\App\Modules\Drivers\Presentation\DriverController::class, 'timeline']);
    Route::post('driver/start-shift', [\App\Modules\Drivers\Presentation\DriverController::class, 'startShift']);
    Route::post('driver/end-shift', [\App\Modules\Drivers\Presentation\DriverController::class, 'endShift']);
    Route::post('driver/start-trip', [\App\Modules\Drivers\Presentation\DriverController::class, 'startTrip']);
    Route::post('driver/finish-trip', [\App\Modules\Drivers\Presentation\DriverController::class, 'finishTrip']);
    Route::post('driver/location', [\App\Modules\Drivers\Presentation\DriverController::class, 'location']);
    Route::post('driver/break', [\App\Modules\Drivers\Presentation\DriverController::class, 'break']);
    Route::post('driver/resume', [\App\Modules\Drivers\Presentation\DriverController::class, 'resume']);
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
});
