<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AuditTrail;
use App\Models\SystemSetting;
use App\Support\Audit\RequestContext;
use App\Support\Mail\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CMS email-template editor. Admin/owner edit the subject/heading/intro copy
 * of each transactional email; overrides are stored in the `email_templates`
 * System Setting and merged over code defaults by App\Support\Mail\EmailTemplate.
 * Copy is plain text (Blade-escaped on render) so nothing executable can be
 * injected through the editor.
 */
final class EmailTemplateController extends Controller
{
    /** Default copy + available placeholders per template type. */
    private const DEFAULTS = [
        'verify_email' => ['label' => 'Verifikasi Email', 'subject' => 'Verify Your Email - SJT Travel', 'heading' => 'Selamat datang, {name}!', 'intro' => 'Terima kasih telah mendaftar. Verifikasi email Anda untuk mulai memesan.', 'placeholders' => ['name']],
        'reset_password' => ['label' => 'Reset Password', 'subject' => 'Reset Your Password - SJT Travel', 'heading' => 'Reset Password', 'intro' => 'Kami menerima permintaan reset password akun Anda.', 'placeholders' => ['name']],
        'payment_success' => ['label' => 'Pembayaran Berhasil (Invoice)', 'subject' => 'Payment Successful - Booking Confirmed', 'heading' => 'Terima kasih, {name}!', 'intro' => 'Pembayaran Anda diterima dan booking terkonfirmasi.', 'placeholders' => ['name', 'code']],
        'payment_failed' => ['label' => 'Pembayaran Gagal', 'subject' => 'Payment Failed - SJT Travel', 'heading' => 'Pembayaran Tidak Berhasil', 'intro' => 'Pembayaran untuk booking {code} tidak berhasil diproses.', 'placeholders' => ['name', 'code']],
        'booking_cancelled' => ['label' => 'Booking Dibatalkan', 'subject' => 'Booking Cancelled - SJT Travel', 'heading' => 'Booking {code} Dibatalkan', 'intro' => 'Booking Anda telah dibatalkan.', 'placeholders' => ['name', 'code']],
        'payment_refunded' => ['label' => 'Refund Diproses', 'subject' => 'Refund Processed - SJT Travel', 'heading' => 'Refund Booking {code}', 'intro' => 'Refund untuk booking Anda telah diproses.', 'placeholders' => ['name', 'code', 'amount']],
        'package_booking' => ['label' => 'Booking Paket Wisata', 'subject' => 'Package Booking - SJT Travel', 'heading' => 'Booking paket {code} diterima', 'intro' => 'Pesanan paket wisata Anda tercatat. Selesaikan pembayaran.', 'placeholders' => ['name', 'code', 'package']],
        'dp_settlement_reminder' => ['label' => 'Pengingat Pelunasan DP', 'subject' => 'Reminder: Selesaikan Pelunasan - SJT Travel', 'heading' => 'Pelunasan booking {code} menunggu', 'intro' => 'Booking Anda menunggu pelunasan sebelum {deadline}.', 'placeholders' => ['name', 'code', 'remaining', 'deadline']],
    ];

    public function index(): JsonResponse
    {
        $overrides = EmailTemplate::all();
        $templates = [];
        foreach (self::DEFAULTS as $type => $def) {
            $ov = is_array($overrides[$type] ?? null) ? $overrides[$type] : [];
            $templates[] = [
                'type' => $type,
                'label' => $def['label'],
                'placeholders' => $def['placeholders'],
                'default' => ['subject' => $def['subject'], 'heading' => $def['heading'], 'intro' => $def['intro']],
                'override' => ['subject' => $ov['subject'] ?? '', 'heading' => $ov['heading'] ?? '', 'intro' => $ov['intro'] ?? ''],
            ];
        }
        return response()->json(['data' => $templates]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:'.implode(',', array_keys(self::DEFAULTS)),
            'subject' => 'sometimes|nullable|string|max:200',
            'heading' => 'sometimes|nullable|string|max:200',
            'intro' => 'sometimes|nullable|string|max:2000',
        ]);
        $type = $data['type'];

        $all = EmailTemplate::all();
        $all[$type] = array_filter([
            'subject' => trim((string) ($data['subject'] ?? '')) ?: null,
            'heading' => trim((string) ($data['heading'] ?? '')) ?: null,
            'intro' => trim((string) ($data['intro'] ?? '')) ?: null,
        ], fn ($v) => $v !== null);
        if ($all[$type] === []) {
            unset($all[$type]); // cleared → fall back to default
        }

        SystemSetting::updateOrCreate(['key' => 'email_templates'], ['value' => $all, 'is_public' => false]);
        $meta = RequestContext::enrich($request, ['type' => $type]);
        AuditTrail::record('cms.email_template_updated', 'EmailTemplate', 'user', (string) $request->user()?->id, $meta);
        ActivityLog::create(['action' => 'cms.email_template_updated', 'subject_type' => 'EmailTemplate', 'subject_id' => null, 'metadata' => $meta]);

        return response()->json(['data' => ['type' => $type, 'saved' => true]]);
    }

    /** Live preview with sample placeholder values. */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:'.implode(',', array_keys(self::DEFAULTS)),
            'subject' => 'sometimes|nullable|string|max:200',
            'heading' => 'sometimes|nullable|string|max:200',
            'intro' => 'sometimes|nullable|string|max:2000',
        ]);
        $def = self::DEFAULTS[$data['type']];
        $sample = ['name' => 'Andi Santoso', 'code' => 'BK-1042', 'package' => 'Bromo Sunrise 2D1N', 'amount' => 'Rp250.000', 'remaining' => 'Rp75.000', 'deadline' => '20 Jul 2026 14:00'];
        $replace = [];
        foreach ($sample as $k => $v) {
            $replace['{'.$k.'}'] = $v;
        }
        $render = fn (string $field): string => strtr(trim((string) ($data[$field] ?? '')) ?: $def[$field], $replace);

        return response()->json(['data' => ['subject' => $render('subject'), 'heading' => $render('heading'), 'intro' => $render('intro')]]);
    }
}
