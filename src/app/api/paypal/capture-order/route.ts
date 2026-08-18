import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { capturePaypalOrder, parseAssociateCustomId, paypalConfigured } from '@/lib/paypal';
import { recordPaidSale } from '@/lib/fulfill';
import { getSettings } from '@/lib/access';

function payerName(captured: {
  payer?: { name?: { given_name?: string; surname?: string } };
}) {
  const given = captured.payer?.name?.given_name ?? '';
  const surname = captured.payer?.name?.surname ?? '';
  return `${given} ${surname}`.trim() || null;
}

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal aún no está configurado' }, { status: 503 });
  }

  let body: { orderId?: string; kind?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }
  if (!body.orderId || !body.kind) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  if (body.kind === 'DONATION') {
    const existing = await prisma.donation.findUnique({ where: { paypalOrderId: body.orderId } });
    if (!existing) {
      return NextResponse.json({ error: 'Donación no encontrada' }, { status: 404 });
    }
    if (existing.status === 'PAID') {
      return NextResponse.json({ ok: true, href: '/apoya/gracias' });
    }
    const captured = await capturePaypalOrder(body.orderId);
    if (captured.status !== 'COMPLETED' && captured.status !== 'APPROVED') {
      return NextResponse.json({ error: 'El pago no se completó' }, { status: 402 });
    }
    await prisma.donation.update({
      where: { paypalOrderId: body.orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        payerEmail: captured.payer?.email_address ?? null,
        payerName: payerName(captured),
      },
    });
    return NextResponse.json({ ok: true, href: '/apoya/gracias' });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }

  const captured = await capturePaypalOrder(body.orderId);
  if (captured.status !== 'COMPLETED' && captured.status !== 'APPROVED') {
    return NextResponse.json({ error: 'El pago no se completó' }, { status: 402 });
  }

  const buyerId = session.user.id;

  if (body.kind === 'SUBSCRIPTION') {
    const pledge = parseAssociateCustomId(captured.purchase_units?.[0]?.custom_id);
    if (!pledge || pledge.userId !== buyerId) {
      return NextResponse.json({ error: 'No se pudo confirmar la asociación' }, { status: 400 });
    }
    const paid = Number(captured.purchase_units?.[0]?.amount?.value);
    const settings = await getSettings();
    const expected = Math.round(settings.subscriptionPrice * pledge.months * 100) / 100;
    const amountPaid = Number.isFinite(paid) && paid > 0 ? paid : expected;
    await recordPaidSale({
      kind: 'SUBSCRIPTION',
      buyerId,
      amountPaid,
      months: pledge.months,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: '/panel' });
  }

  if (body.kind === 'COURSE' && body.id) {
    const course = await prisma.course.findUnique({ where: { id: body.id } });
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    await recordPaidSale({
      kind: 'COURSE',
      buyerId,
      sellerId: course.teacherId,
      courseId: course.id,
      amountPaid: course.price,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: `/cursos/${course.slug}` });
  }

  if (body.kind === 'PRODUCT' && body.id) {
    const product = await prisma.product.findUnique({ where: { id: body.id } });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    await recordPaidSale({
      kind: 'PRODUCT',
      buyerId,
      sellerId: product.creatorId,
      productId: product.id,
      amountPaid: product.price,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: `/marketplace/${product.id}` });
  }

  return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
}
