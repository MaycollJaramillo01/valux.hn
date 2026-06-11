// Envío de correos vía Resend (API REST, sin SDK).
// Si RESEND_API_KEY no está configurada, la verificación queda desactivada
// y las cuentas se activan de inmediato (comportamiento previo).

export function emailVerificationEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const baseUrl =
    process.env.AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const verifyUrl = `${baseUrl}/api/verificar?token=${token}`;
  const from = process.env.EMAIL_FROM ?? 'VALUX <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Confirmá tu cuenta de VALUX',
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#050505;">
          <p style="font-family:Consolas,monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1e50a0;">VALUX / HN</p>
          <h1 style="font-size:26px;margin:8px 0 16px;">Hola ${name},</h1>
          <p>Gracias por crear tu cuenta en VALUX. Confirmá tu correo para activarla:</p>
          <p style="margin:28px 0;">
            <a href="${verifyUrl}" style="background:#1e50a0;color:#fff;padding:12px 22px;text-decoration:none;font-family:Consolas,monospace;font-size:13px;letter-spacing:1px;">CONFIRMAR MI CUENTA</a>
          </p>
          <p style="font-size:13px;color:#6e675d;">El enlace vence en 24 horas. Si no creaste esta cuenta, ignorá este correo.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend respondió ${res.status}: ${detail}`);
  }
}
