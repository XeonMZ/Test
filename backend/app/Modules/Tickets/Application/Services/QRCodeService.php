<?php

namespace App\Modules\Tickets\Application\Services;

use Illuminate\Support\Str;

final class QRCodeService
{
    /** @return array{payload:string,signature:string,token:string,timestamp:string} */
    public function makePayload(string $bookingUuid, string $ticketUuid, string $tripUuid, string $passengerUuid): array
    {
        $timestamp = now()->toIso8601String();
        $token = hash('sha256', $ticketUuid.'|'.Str::random(40));
        $signature = $this->signature($bookingUuid, $ticketUuid, $tripUuid, $passengerUuid, $timestamp, $token);
        $payload = json_encode(['booking_uuid'=>$bookingUuid,'ticket_uuid'=>$ticketUuid,'trip_uuid'=>$tripUuid,'passenger_uuid'=>$passengerUuid,'signature'=>$signature,'timestamp'=>$timestamp,'verification_token'=>$token], JSON_THROW_ON_ERROR);
        return ['payload'=>$payload,'signature'=>$signature,'token'=>$token,'timestamp'=>$timestamp];
    }

    /** @return array<string,string> */
    public function decodeAndVerify(string $payload): array
    {
        $data = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($data)) throw new \RuntimeException('Invalid QR payload.');
        foreach (['booking_uuid','ticket_uuid','trip_uuid','passenger_uuid','signature','timestamp','verification_token'] as $key) {
            if (! isset($data[$key]) || ! is_string($data[$key])) throw new \RuntimeException('Invalid QR payload field.');
        }
        $expected = $this->signature($data['booking_uuid'], $data['ticket_uuid'], $data['trip_uuid'], $data['passenger_uuid'], $data['timestamp'], $data['verification_token']);
        if (! hash_equals($expected, $data['signature'])) throw new \RuntimeException('Invalid QR signature.');
        return $data;
    }

    private function signature(string $bookingUuid, string $ticketUuid, string $tripUuid, string $passengerUuid, string $timestamp, string $token): string
    {
        return hash_hmac('sha256', implode('|', [$bookingUuid, $ticketUuid, $tripUuid, $passengerUuid, $timestamp, $token]), (string) config('app.key', 'stms'));
    }
}
