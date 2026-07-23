<?php

declare(strict_types=1);

namespace App\Mail;

use App\Support\Auth\OtpService;
use App\Support\Mail\EmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Carries a one-time passcode for either auth flow.
 *
 * Two deliberate choices:
 *
 *  - The code is NOT in the subject line. Lock-screen and desktop
 *    notification previews render subjects in full, so a subject-line code is
 *    readable by anyone glancing at a locked phone. The convenience is not
 *    worth the shoulder-surfing exposure.
 *  - The passcode is passed as a constructor value and lives only for the
 *    lifetime of the queued job. It is never written to email_logs metadata.
 */
final class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $toAddress,
        public readonly string $code,
        public readonly string $purpose,
        public readonly int $expireMinutes,
        public readonly ?string $requestIp = null,
        public readonly ?string $requestedAt = null,
    ) {}

    public function build(): self
    {
        $isReset = $this->purpose === OtpService::PURPOSE_PASSWORD_RESET;

        $tpl = EmailTemplate::resolve(
            $isReset ? 'reset_password' : 'verify_email',
            $isReset
                ? [
                    'subject' => 'Kode Reset Password Anda - SJT Travel',
                    'heading' => 'Reset password akun Anda',
                    'intro' => 'Gunakan kode di bawah ini untuk membuat password baru. Jangan bagikan kode ini kepada siapa pun.',
                ]
                : [
                    'subject' => 'Kode Verifikasi Email Anda - SJT Travel',
                    'heading' => 'Verifikasi alamat email Anda',
                    'intro' => 'Masukkan kode di bawah ini pada halaman verifikasi untuk mengaktifkan akun Anda.',
                ],
            ['name' => $this->recipientName],
        );

        return $this
            ->subject($tpl['subject'])
            ->view('emails.otp')
            ->text('emails.otp-text')
            ->with([
                'tpl' => $tpl,
                'code' => $this->code,
                'isReset' => $isReset,
                'expireMinutes' => $this->expireMinutes,
                'recipientName' => $this->recipientName,
                'toAddress' => $this->toAddress,
                'requestIp' => $this->requestIp,
                'requestedAt' => $this->requestedAt,
                'preheader' => 'Kode berlaku '.$this->expireMinutes.' menit. Jangan bagikan kepada siapa pun.',
            ]);
    }
}
