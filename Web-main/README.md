# SJT Travel Management System (STMS)

STMS is a premium travel booking and operations platform foundation. Sprint 1 initializes a production-ready frontend, backend placeholder, Docker environment, and project documentation.

## Tech Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript strict mode
- **Styling:** Tailwind CSS with Poppins and Inter typography
- **State/Data:** TanStack Query, Zustand, Axios
- **Forms/Validation:** React Hook Form, Zod
- **UI:** Framer Motion, Lucide React, clsx
- **PWA:** next-pwa manifest-ready setup
- **Backend:** Laravel 12 folder placeholder
- **Tooling:** ESLint, Prettier, Husky
- **Infrastructure:** Docker, Docker Compose, MySQL, Redis

## Folder Structure

```text
frontend/
  app/
  components/
  features/
  hooks/
  lib/
  public/
  services/
  styles/
  types/
backend/
  app/
  bootstrap/
  config/
  database/
  public/
  resources/
  routes/
  storage/
  tests/
docs/
docker/
  backend/
  frontend/
```

## Installation

Install frontend dependencies:

```bash
cd frontend
npm install
```

Run the frontend locally:

```bash
npm run dev
```

Run the full Docker environment:

```bash
docker compose up --build
```

Frontend: <http://localhost:3000>  
Backend placeholder service: <http://localhost:8000>  
MySQL: `localhost:3306`  
Redis: `localhost:6379`

## Notes

The backend directory intentionally contains only a Laravel-compatible placeholder structure. Laravel implementation begins in a later sprint.

## Sprint 4A — Payment, QR Ticket & Driver Operations

Sprint 4A prepares the payment lifecycle, ticket lifecycle, QR validation, and driver check-in business flow without live GPS or realtime tracking.

### Payment Lifecycle

Payments are modeled through `PaymentService`, `PaymentRepository`, `PaymentGateway`, `MidtransGateway`, and `PaymentWebhookHandler`. Midtrans is sandbox-ready for Snap, QRIS, and Bank Transfer, and credentials are read from environment variables instead of being hardcoded.

Payment states are strictly validated by `PaymentStateMachine`:

`pending → paid | failed | expired`

`paid → refunded | partial_refunded`

`partial_refunded → refunded`

All invalid transitions are rejected with a domain exception.

### Booking Lifecycle

Bookings use `BookingStateMachine` with these states:

`draft`, `seat_locked`, `waiting_payment`, `paid`, `ticket_issued`, `checked_in`, `completed`, `cancelled`, `expired`, and `refunded`.

The state machine prevents invalid jumps such as `draft → completed` and keeps payment, ticketing, check-in, refund, cancellation, and expiry flows explicit.

### Idempotency & Webhooks

Payment creation requires an idempotency key so repeated client retries return the existing payment attempt. Webhook processing records gateway references so duplicate Midtrans callbacks are ignored after the first successful processing.

### QR Ticket Flow

After successful payment, `TicketService` creates a ticket UUID and QR payload containing booking UUID, ticket UUID, trip UUID, passenger UUID, and an HMAC digital signature. QR content is persisted through a storage abstraction so local, S3, or future disks can be swapped without changing ticket business logic.

### Driver Check-in Flow

Driver operations are prepared as:

Open Trip → Scan QR → Validate Ticket → Show Passenger → Checked In or No Show

Check-in records store driver UUID, optional GPS coordinates, status, and timestamp. This is business-flow ready and intentionally does not implement live GPS or realtime tracking.

### Events, Queues & API Documentation

Domain events are prepared for `PaymentSucceeded`, `PaymentFailed`, `PaymentExpired`, `TicketGenerated`, `PassengerCheckedIn`, and `PassengerNoShow`. Queue-ready jobs are prepared for QR generation, ticket PDF generation, notifications, and audit logs.

Swagger/OpenAPI documentation is available in `docs/api/payment-ticket-openapi.yaml` for `/api/v1/payments`, `/api/v1/payments/webhook`, `/api/v1/tickets`, and `/api/v1/check-in`.

## Architecture Hardening

The hardening layer improves maintainability without changing UI or existing business flow.

### System Settings & Cache

Operational values must be resolved through `SettingsService` and `OperationalPolicy`, backed by the `system_settings` table and cache invalidation. This covers seat lock time, payment timeout, GPS interval, company name, WhatsApp number, currency, backup enabled, and maintenance mode.

### Enums & Value Objects

Architecture-level enums are available for trip status, vehicle status, driver status, notification type, user role, and membership level. Shared value objects cover money, coordinates, phone numbers, emails, seat numbers, QR codes, booking codes, trip codes, and vehicle plates.

### Repositories & API Resources

Aggregate repository interfaces are prepared so domain/application layers do not depend on Eloquent. Standard API response helpers cover success responses, pagination metadata, and validation errors.

### Exceptions, Audit & Feature Flags

Custom domain exceptions are available for booking, payment, seats, trips, drivers, vehicles, routes, and pricing. Audit helpers prepare automatic records for create, update, delete, login, logout, payment, booking, and driver check-in actions. Database-driven feature flags are prepared for GPS, membership, voucher, backup, realtime, and QR.

### Health & Observability

Operational endpoints are prepared for `/health`, `/ready`, and `/version`. Observability helpers prepare structured logs with correlation ID, request ID, and performance timing.

### Cache & Testing Foundation

Cache keys are standardized for routes, schedules, pricing, settings, and dashboard data, with Redis-ready cache abstraction. Testing helpers, seeders, and mock repository utilities are prepared for future automated test coverage.

## Sprint 4B.1 — Realtime Infrastructure

Sprint 4B.1 adds Laravel Reverb, broadcasting, Redis queue/cache readiness, and frontend Echo infrastructure without changing existing UI flows.

### Backend Realtime

Broadcasting is configured through Reverb and Redis. Private channels are prepared for `private-customer.{bookingId}`, `private-driver.{driverId}`, `private-admin`, and `private-owner`. Domain events include `DriverLocationUpdated`, `TripStatusUpdated`, and `NotificationCreated`; all are queued through broadcast jobs.

### GPS Flow

The GPS service follows: Driver starts trip → GPS enabled → driver sends location every configurable interval from System Settings → location history is stored → update is queued for broadcast → trip stops → GPS disabled. GPS, Realtime, and Notifications feature flags stop the flow gracefully when disabled.

### Frontend Realtime

The frontend adds Laravel Echo and Pusher JS, a shared realtime layer, `RealtimeProvider`, `EchoManager`, `ReconnectManager`, `ConnectionIndicator`, `OfflineBanner`, and hooks for realtime state, trip tracking, notifications, and connection status.

### Realtime Pages

New pages are prepared for customer live tracking, driver dashboard GPS actions, admin live operations, and owner fleet overview while preserving the existing UI.

### Testing

Feature, unit, and broadcast test scaffolds are added for realtime routes, GPS service availability, and broadcast event availability.

## Sprint 6B — Customer Portal

Customer Portal is implemented as a UI and integration layer on top of the existing backend engines. It does not introduce a second booking, payment, ticket, notification, realtime, or state-machine implementation.

### Flow

1. Customers review dashboard summaries for upcoming trips, active bookings, waiting payments, active tickets, membership, promos, vouchers, notification previews, last trips, quick actions, and booking progress.
2. Booking screens link to the existing booking APIs for customer bookings, booking detail, seat, passenger, invoice, cancel booking, timeline, and history.
3. Payment screens present waiting, success, failed, expired, retry, countdown, polling, and history states using the existing PaymentService and Midtrans integration.
4. Ticket screens present customer tickets, ticket detail, QR ticket, PDF download, check-in status, boarding status, and trip detail using the existing TicketService.
5. Profile, membership, promo, trip history, and notification center screens use the shared Sprint 6A responsive design system with dark-mode compatible components.

### UI

Customer pages live under `/customer` and use the Sprint 6A app shell, role navigation, cards, badges, tables, filters, timeline, skeleton, empty state, error state, and confirmation dialog foundations.

Implemented pages:

- `/customer`
- `/customer/bookings`
- `/customer/bookings/[id]`
- `/customer/payment`
- `/customer/tickets`
- `/customer/tickets/[id]`
- `/customer/profile`
- `/customer/membership`
- `/customer/promo`
- `/customer/promo/[id]`
- `/customer/trip-history`
- `/customer/notifications`
- `/customer/tracking`

### Existing Endpoints Used

- `GET /customer/bookings`
- `GET /booking/{id}`
- `POST /booking/cancel`
- `GET /v1/payments/{payment}`
- `GET /v1/tickets`
- `GET /v1/tickets/{ticket}`
- `GET /v1/tickets/{ticket}/qr`
- `GET /profile`
- `PUT /profile`
- `PUT /change-password`

### Duplicate Audit Result

Sprint 6B adds only frontend portal UI and typed integration helpers. No new backend model, repository, service, controller, event, queue job, route, middleware, provider, config, migration, or state machine was added for Customer Portal.
