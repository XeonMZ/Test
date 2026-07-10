<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\Installer\InstallerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class InstallerController extends Controller
{
    public function __construct(private readonly InstallerService $installer) {}

    public function status(): JsonResponse
    {
        return response()->json(['installed' => $this->installer->installed(), 'requirements' => $this->installer->requirements()]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($this->installer->installed()) {
            return response()->json(['message' => 'Installer is locked.'], 403);
        }

        $data = $request->validate([
            'company.name' => ['required', 'string', 'max:255'], 'company.logo' => ['nullable', 'string', 'max:2048'], 'company.address' => ['required', 'string'], 'company.phone' => ['required', 'string', 'max:50'], 'company.email' => ['required', 'email'], 'company.website' => ['nullable', 'url'], 'company.tax_number' => ['nullable', 'string', 'max:100'], 'company.timezone' => ['required', 'timezone'], 'company.currency' => ['required', 'string', 'size:3'],
            'owner.name' => ['required', 'string', 'max:255'], 'owner.email' => ['required', 'email', 'unique:users,email'], 'owner.password' => ['required', 'confirmed', 'min:8'],
            'admin.name' => ['required', 'string', 'max:255'], 'admin.email' => ['required', 'email', 'different:owner.email', 'unique:users,email'], 'admin.password' => ['required', 'confirmed', 'min:8'],
            'configuration.seat_lock_minutes' => ['required', 'integer', 'min:1', 'max:120'], 'configuration.booking_expiry_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'], 'configuration.ticket_expiry_minutes' => ['required', 'integer', 'min:1', 'max:10080'], 'configuration.qr_expiry_minutes' => ['nullable', 'integer', 'min:1', 'max:10080'], 'configuration.payment_expiry_minutes' => ['required', 'integer', 'min:1', 'max:10080'], 'configuration.timezone' => ['required', 'timezone'], 'configuration.language' => ['required', 'string', 'max:10'], 'configuration.locale' => ['nullable', 'string', 'max:20'], 'configuration.date_format' => ['nullable', 'string', 'max:32'], 'configuration.time_format' => ['nullable', 'string', 'max:32'], 'configuration.currency' => ['required', 'string', 'size:3'], 'configuration.invoice_prefix' => ['nullable', 'string', 'max:20'], 'configuration.broadcast_enabled' => ['nullable', 'boolean'], 'configuration.cancellation_rules' => ['nullable', 'array'],
            'payment.midtrans.server_key' => ['nullable', 'string'], 'payment.midtrans.client_key' => ['nullable', 'string'], 'payment.midtrans.environment' => ['required', Rule::in(['sandbox', 'production'])],
            'mail.host' => ['required', 'string'], 'mail.port' => ['required', 'integer', 'min:1', 'max:65535'], 'mail.username' => ['nullable', 'string'], 'mail.password' => ['nullable', 'string'], 'mail.encryption' => ['nullable', Rule::in(['tls', 'ssl', 'none'])], 'mail.sender_name' => ['required', 'string'], 'mail.sender_email' => ['required', 'email'],
            'demo_data' => ['boolean'],
        ]);

        return response()->json(['installed' => true, 'result' => $this->installer->install($data)], 201);
    }
}
