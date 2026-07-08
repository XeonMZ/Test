# Realtime Infrastructure

Sprint 4B.1 adds Laravel Reverb, broadcasting configuration, Redis queue/cache configuration, private broadcast channels, realtime domain events, queue jobs, GPS service, and frontend Echo integration.

## Channels

- `private-customer.{bookingId}` for customer booking/trip updates.
- `private-driver.{driverId}` for driver-specific GPS and operational updates.
- `private-admin` for live operations dashboards.
- `private-owner` for owner fleet overview counts.

## Feature Flags

Realtime, GPS, and Notifications must be enabled before broadcasting. If disabled, services return gracefully and stop producing broadcast jobs.

## GPS Flow

Driver starts trip, GPS is enabled, location updates are accepted at the configurable system-settings interval, history is stored, updates are queued for broadcast, and GPS stops when the trip stops.
