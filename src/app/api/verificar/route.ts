import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?verificacion=invalida', url));
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    if (record) await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL('/login?verificacion=invalida', url));
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { email: record.email } });

  return NextResponse.redirect(new URL('/login?verificacion=ok', url));
}
