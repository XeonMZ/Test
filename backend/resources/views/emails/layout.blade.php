<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ $subject ?? 'SJT Travel' }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header / Logo -->
  <tr><td align="center" style="padding:8px 0 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background-color:#1d4ed8;border-radius:14px;width:44px;height:44px;text-align:center;vertical-align:middle;">
        <span style="color:#ffffff;font-size:20px;font-weight:800;line-height:44px;">S</span>
      </td>
      <td style="padding-left:12px;">
        <span style="font-size:20px;font-weight:800;color:#0f172a;">SJT Travel</span><br>
        <span style="font-size:11px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;">Sekawan Jaya Trans</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background-color:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 1px 4px rgba(15,23,42,0.06);">
    @yield('content')
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:24px 12px 8px;">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8;">
      <strong style="color:#334155;">SJT Travel</strong><br>
      <a href="mailto:mail@sekawanjayatrans.com" style="color:#1d4ed8;text-decoration:none;">mail@sekawanjayatrans.com</a>
      &nbsp;·&nbsp;
      <a href="https://sekawanjayatrans.com" style="color:#1d4ed8;text-decoration:none;">sekawanjayatrans.com</a><br>
      Butuh bantuan? Hubungi Customer Support kami melalui email di atas.<br>
      © {{ date('Y') }} SJT Travel. Seluruh hak cipta dilindungi.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
