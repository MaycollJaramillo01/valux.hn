import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendNewsletterWelcomeEmail } from '@/lib/email';

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const email = parsed.data.email;
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (existing) {
    if (existing.unsubscribedAt) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribedAt: null },
      });
    }
    return NextResponse.json({ ok: true });
  }

  await prisma.newsletterSubscriber.create({ data: { email } });

  if (process.env.RESEND_API_KEY) {
    try {
      await sendNewsletterWelcomeEmail(email);
    } catch (err) {
      console.error('Newsletter bienvenida:', email, err);
    }
  }

  return NextResponse.json({ ok: true });
}
