import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emailVerificationEnabled, sendVerificationEmail } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta con ese email' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const requiresVerification = emailVerificationEnabled();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      // Sin Resend configurado la cuenta queda activa de inmediato.
      emailVerified: requiresVerification ? null : new Date(),
    },
  });

  if (requiresVerification) {
    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: { token, email, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    try {
      await sendVerificationEmail(email, name, token);
    } catch (err) {
      console.error('No se pudo enviar el correo de verificación:', err);
      // Si el correo falla, activamos la cuenta para no dejarla inutilizable.
      await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
      await prisma.verificationToken.deleteMany({ where: { email } });
      return NextResponse.json({ ok: true, verificationRequired: false }, { status: 201 });
    }
  }

  return NextResponse.json(
    { ok: true, verificationRequired: requiresVerification },
    { status: 201 }
  );
}
