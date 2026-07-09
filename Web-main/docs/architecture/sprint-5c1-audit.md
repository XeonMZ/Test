# Sprint 5C.1 – Final Architecture Audit & Stabilization

## Scope

Sprint 5C.1 is an architecture-only stabilization pass. No UI, product feature, endpoint contract, or business-flow changes were introduced.

## Duplicate Findings

### Found and fixed

| Area | Duplicate/overlap | Canonical owner after audit | Action |
| --- | --- | --- | --- |
| Queue job | `DriverLocationBroadcastJob` overlapped with `BroadcastLocationJob` for driver-location realtime dispatch | `App\Jobs\BroadcastLocationJob` | Removed duplicate job class. |
| Payment repository implementation | `InMemoryPaymentRepository` duplicated the payment repository responsibility while production binding already used Eloquent | `EloquentPaymentRepository` | Removed unused duplicate application repository implementation. |
| Ticket repository implementation | App-level `InMemoryTicketRepository` duplicated the production Eloquent ticket repository | `EloquentTicketRepository`; test-only fake moved under `Tests\Support` | Removed app implementation and introduced a test-scoped fake for unit isolation. |
| Domain entity names | Domain `Payment` and Eloquent `Payment` shared the same class basename | `PaymentRecord` for domain; `Payment` for Eloquent model | Renamed the domain entity and all type hints/imports. |
| Domain entity names | Domain `Ticket` and Eloquent `Ticket` shared the same class basename | `TicketRecord` for domain; `Ticket` for Eloquent model | Renamed the domain entity and all type hints/imports. |
| Feature flag enum name | Support enum `FeatureFlag` and Eloquent model `FeatureFlag` shared the same class basename | `FeatureFlagDefinition` for enum; `FeatureFlag` for Eloquent model | Renamed the support enum and all realtime service references. |

### Not changed intentionally

- Legacy non-`v1` auth and booking endpoints remain in place as compatibility endpoints.
- Existing frontend UI components, pages, layouts, and flows were not modified.
- Test-only in-memory fakes remain allowed under `Tests\Support` and are not bound in production providers.

## Refactored Files

- `backend/app/Modules/Payments/Domain/Entities/PaymentRecord.php`
- `backend/app/Modules/Payments/Domain/Repositories/PaymentGateway.php`
- `backend/app/Modules/Payments/Domain/Repositories/PaymentRepository.php`
- `backend/app/Modules/Payments/Application/Services/PaymentService.php`
- `backend/app/Modules/Payments/Application/Services/PaymentWebhookService.php`
- `backend/app/Modules/Payments/Infrastructure/Gateways/MidtransGateway.php`
- `backend/app/Modules/Payments/Infrastructure/Repositories/EloquentPaymentRepository.php`
- `backend/app/Modules/Tickets/Domain/Entities/TicketRecord.php`
- `backend/app/Modules/Tickets/Domain/Repositories/TicketRepository.php`
- `backend/app/Modules/Tickets/Application/Services/TicketService.php`
- `backend/app/Modules/Tickets/Infrastructure/Repositories/EloquentTicketRepository.php`
- `backend/app/Support/FeatureFlags/FeatureFlagDefinition.php`
- `backend/app/Modules/Realtime/Application/RealtimeService.php`
- `backend/tests/Unit/Tickets/TicketValidationTest.php`
- `backend/tests/Support/InMemoryTicketRepository.php`

## Deleted Files

- `backend/app/Jobs/DriverLocationBroadcastJob.php`
- `backend/app/Modules/Payments/Infrastructure/Repositories/InMemoryPaymentRepository.php`
- `backend/app/Modules/Tickets/Infrastructure/Repositories/InMemoryTicketRepository.php`
- `backend/app/Modules/Payments/Domain/Entities/Payment.php`
- `backend/app/Modules/Tickets/Domain/Entities/Ticket.php`
- `backend/app/Support/FeatureFlags/FeatureFlag.php`

## Merged/Canonicalized Files

- Driver-location queue responsibility is consolidated into `backend/app/Jobs/BroadcastLocationJob.php`.
- Payment persistence responsibility is consolidated into `backend/app/Modules/Payments/Infrastructure/Repositories/EloquentPaymentRepository.php`.
- Ticket persistence responsibility is consolidated into `backend/app/Modules/Tickets/Infrastructure/Repositories/EloquentTicketRepository.php`.
- Ticket unit-test persistence isolation is consolidated into `backend/tests/Support/InMemoryTicketRepository.php`.

## Dependency Graph Audit

Target graph remains:

```text
Controller
↓
Application Service
↓
Domain
↓
Repository Interface
↓
Infrastructure Repository
```

Observed canonical bindings:

| Interface/contract | Implementation |
| --- | --- |
| `BookingRepository` | `EloquentBookingRepository` |
| `PaymentRepository` | `EloquentPaymentRepository` |
| `PaymentGateway` | `MidtransGateway` |
| `TicketRepository` | `EloquentTicketRepository` |
| `TicketStorage` | `LocalTicketStorage` |
| `DriverLocationRepository` | `InMemoryDriverLocationRepository` |
| `SettingsRepository` | `InMemorySettingsRepository` |
| `FeatureFlagRepository` | `InMemoryFeatureFlagRepository` |

No new `Service → Controller`, `Repository → Service`, `Model → Service`, or new direct `Controller → Repository` dependency was introduced.

## Database Audit

- No duplicate `Schema::create(...)` table declarations were detected in migrations.
- Existing migrations continue to centralize core STMS tables, payment/ticket lifecycle tables, architecture hardening tables, auth foundation columns, booking engine columns, payment integration columns, ticket engine columns, and driver operation extensions.
- UUID consistency remains model-concern driven via `HasUuid` for Eloquent models that use UUIDs.
- FK, index, cascade/restrict, and soft-delete semantics were not changed in this sprint.

## Route/API Audit

- `/api/v1` remains the canonical prefix for payment, ticket, check-in, trip-passenger, and driver operation endpoints.
- Existing legacy auth and booking endpoints remain outside `v1` intentionally for backward compatibility.
- No duplicate `method + path` route was added by this audit.
- JSON response format continues to use the existing `ApiResponse` envelope with `success`, `message`, and `data`.

## Repository Audit

- `BookingRepository → EloquentBookingRepository` remains the single booking persistence implementation.
- `PaymentRepository → EloquentPaymentRepository` is now the single app-level payment persistence implementation.
- `TicketRepository → EloquentTicketRepository` is now the single app-level ticket persistence implementation.
- Test doubles are scoped under `Tests\Support` and are not production container bindings.

## Queue Audit

- Duplicate driver-location broadcast job was removed.
- Existing jobs retain distinct responsibilities: booking expiry, payment expiry/reminders/notifications, ticket generation/QR/PDF/sending, passenger check-in/boarding, driver shift/trip/statistics, and realtime broadcast notifications.

## Event Audit

- Existing event classes remain canonical by bounded context: booking events in Booking, payment events in Payments, check-in events in CheckIn, and realtime events in Realtime.
- No duplicate event class was introduced or found requiring deletion in this pass.

## State Machine Audit

| State machine | Canonical owner |
| --- | --- |
| Booking | `BookingStateMachine` |
| Payment | `PaymentStateMachine` |
| Ticket | `TicketStateMachine` |
| Driver Shift | `DriverShiftStateMachine` |
| Driver Trip | `DriverTripStateMachine` |
| Check In | `CheckInStateMachine` |
| Boarding | `BoardingStateMachine` |

## Seeder Audit

- `DatabaseSeeder` creates Owner, Admin, Driver, and Customer users.
- All seeded default user passwords use `Hash::make()`.
- Default emails are `admin@stms.test`, `owner@stms.test`, `driver@stms.test`, and `customer@stms.test`.

## Config Audit

- No duplicate config file was added.
- Repository bindings remain centralized in `RepositoryServiceProvider`.
- Payment config remains centralized in `config/payment.php`.

## Remaining Technical Debt

- Several repository interfaces for future modules currently have no production implementation and should only be implemented when their module behavior is activated.
- Some legacy endpoints still live outside `/api/v1`; they should remain documented as compatibility routes until a deliberate versioned migration sprint.
- Full route/database/cache validation depends on successful dependency installation and a compatible runtime.
