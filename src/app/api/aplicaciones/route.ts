import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applicationFieldLabels, applicationSchema } from '@/lib/applications';
import { sendApplicationNoticeEmail } from '@/lib/email';
import { saveUploadedImage } from '@/lib/upload';

export const runtime = 'nodejs';

const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (String(form.get('website') || '').trim()) {
    return NextResponse.json({ ok: true });
  }

  let photoUrl: string | null = null;
  try {
    photoUrl = await saveUploadedImage(form.get('photo') as File | null, 'aplicaciones', {
      maxBytes: PHOTO_MAX_BYTES,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo guardar la foto';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (!photoUrl) {
    return NextResponse.json({ error: 'Agregá una foto (JPG, PNG, WebP o GIF, máx. 10 MB)' }, { status: 400 });
  }

  const raw: Record<string, string> = {};
  form.forEach((value, key) => {
    if (key === 'photo' || key === 'website') return;
    if (typeof value === 'string') raw[key] = value;
  });

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }

  const { consent: _consent, website: _website, ...data } = parsed.data;
  const application = await prisma.membershipApplication.create({
    data: { ...data, photoUrl },
  });

  const notifyTo = process.env.APPLICATION_NOTIFY_EMAIL?.trim().toLowerCase();
  if (process.env.RESEND_API_KEY && notifyTo) {
    const rows = applicationFieldLabels
      .map(({ key, label }) => {
        if (key === 'photoUrl') return { label, value: photoUrl };
        const value = data[key as keyof typeof data];
        return typeof value === 'string' && value ? { label, value } : null;
      })
      .filter((row): row is { label: string; value: string } => Boolean(row));
    try {
      await sendApplicationNoticeEmail(notifyTo, {
        fullName: application.fullName,
        email: application.email,
        rows,
      });
    } catch (err) {
      console.error('Aviso de ficha de ingreso:', application.id, err);
    }
  }

  return NextResponse.json({ ok: true });
}
