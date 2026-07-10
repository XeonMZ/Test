# Sprint 6E.1 Notification Privacy & Authorization Audit

## Privacy Audit Summary

Notifications are private by default. Customer and driver realtime notifications must use authenticated identity channels only: `private-user.{userId}` or `private-notification.{userId}`. Admin, owner, and system channels remain role-scoped and are reserved for operational, owner, and system notifications.

## Authorization Matrix

| Actor | Own identity channel | Another user identity channel | Admin channel | Owner channel | System channel |
| --- | --- | --- | --- | --- | --- |
| Customer | Allow | Deny | Deny | Deny | Deny |
| Driver | Allow | Deny | Deny | Deny | Deny |
| Admin | Allow | Deny | Allow | Deny | Deny |
| Owner | Allow | Deny | Allow | Allow | Allow |

## Realtime Channel Verification

Resource-style notification subscriptions such as `customer.{bookingId}` and `driver.{driverId}` were removed from broadcast channel authorization. Notification broadcasts now reject arbitrary resource/shared customer or driver channels at event construction time.

## API Verification

No notification API endpoints currently exist in `routes/api.php`; therefore no new endpoints were added. Future list, detail, read, unread, delete, bulk-delete, and preference actions must scope notification queries by authenticated user unless existing role permissions explicitly grant broader access.

## Frontend Verification

The Notification Center realtime subscription now resolves the authenticated user id from the existing browser session/local storage integration and subscribes to `private-user.{userId}`. Customer and driver views do not fall back to role/shared channels when no authenticated user id is available. Admin and owner views may use their role channels for authorized operational streams.

## Duplicate Audit

No duplicate notification engine, service, repository, controller, queue, event, model, migration, websocket layer, hook, component, or feature module was added.

## Security Risks Found

- Reverb channel authorization previously allowed any authenticated user to subscribe to `customer.{bookingId}` and `driver.{driverId}`.
- The frontend Notification Center previously subscribed customers and drivers to preview/shared role-like channels instead of authenticated identity channels.
- The notification broadcast event previously accepted arbitrary channel strings.

## Fixes Applied

- Replaced customer/driver notification channel authorization with identity-scoped `user.{userId}` and `notification.{userId}` channels.
- Restricted `admin`, `owner`, and `system` channel authorization according to the existing role hierarchy.
- Added event-level validation so notification broadcasts can only target identity or authorized role channels.
- Updated the frontend Notification Center to avoid shared customer/driver realtime subscriptions.
