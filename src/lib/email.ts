// Envío de correos vía Resend (API REST, sin SDK).
// Si RESEND_API_KEY no está configurada, la verificación queda desactivada
// y las cuentas se activan de inmediato (comportamiento previo).

function appBaseUrl() {
  return (
    process.env.AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')
  );
}

function fromAddress() {
  return process.env.EMAIL_FROM ?? 'VALUX <onboarding@resend.dev>';
}

function valuxEmailShell(inner: string, footer = 'VALUX / Honduras') {
  return `
  <div style="background:#050505;padding:32px 16px;">
    <div style="font-family:'Quicksand',CenturyGothic,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#f5f1ea;color:#050505;">
      <p style="font-family:Consolas,monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1e50a0;margin:0 0 8px;">VALUX / HN</p>
      ${inner}
      <p style="font-size:12px;color:#6e675d;margin:32px 0 0;border-top:1px solid rgba(5,5,5,.12);padding-top:16px;">${footer}</p>
    </div>
  </div>`;
}

async function sendResend(to: string | string[], subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromAddress(), to: Array.isArray(to) ? to : [to], subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend respondió ${res.status}: ${detail}`);
  }
}

export function emailVerificationEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${appBaseUrl()}/api/verificar?token=${token}`;
  await sendResend(
    to,
    'Confirmá tu cuenta de VALUX',
    valuxEmailShell(`
      <h1 style="font-size:26px;margin:8px 0 16px;">Hola ${name},</h1>
      <p>Gracias por crear tu cuenta en VALUX. Confirmá tu correo para activarla:</p>
      <p style="margin:28px 0;">
        <a href="${verifyUrl}" style="background:#1e50a0;color:#fff;padding:12px 22px;text-decoration:none;font-family:Consolas,monospace;font-size:13px;letter-spacing:1px;">CONFIRMAR MI CUENTA</a>
      </p>
      <p style="font-size:13px;color:#6e675d;">El enlace vence en 24 horas. Si no creaste esta cuenta, ignorá este correo.</p>
    `)
  );
}

export async function sendBlogUpdateEmail(to: string, post: { title: string; excerpt: string; slug: string }) {
  const url = `${appBaseUrl()}/blog/${post.slug}`;
  await sendResend(
    to,
    `Mira lo nuevo de VALUX: ${post.title}`,
    valuxEmailShell(
      `
      <h1 style="font-size:26px;margin:8px 0 16px;">Mira lo nuevo de VALUX</h1>
      <h2 style="font-size:20px;margin:0 0 12px;">${post.title}</h2>
      <p>${post.excerpt}</p>
      <p style="margin:28px 0;">
        <a href="${url}" style="background:#1e50a0;color:#fff;padding:12px 22px;text-decoration:none;font-family:Consolas,monospace;font-size:13px;letter-spacing:1px;">LEER EN EL BLOG</a>
      </p>
    `,
      'Recibís este correo porque te suscribiste al blog de VALUX.'
    )
  );
}
