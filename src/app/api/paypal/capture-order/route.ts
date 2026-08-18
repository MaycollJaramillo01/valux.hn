import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  ASSOCIATE_TERM_MONTHS,
  amountsMatch,
  capturePaypalOrder,
  paypalCapturedAmount,
  paypalConfigured,
} from '@/lib/paypal';
import { recordPaidSale } from '@/lib/fulfill';

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

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }
  if (!body.orderId) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const intent = await prisma.paypalIntent.findUnique({ where: { paypalOrderId: body.orderId } });
  if (!intent) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  if (intent.kind === 'DONATION') {
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
    if (!amountsMatch(intent.amount, paypalCapturedAmount(captured))) {
      return NextResponse.json({ error: 'El monto cobrado no coincide' }, { status: 409 });
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
  if (!session?.user?.id || session.user.id !== intent.buyerId) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }

  const captured = await capturePaypalOrder(body.orderId);
  if (captured.status !== 'COMPLETED' && captured.status !== 'APPROVED') {
    return NextResponse.json({ error: 'El pago no se completó' }, { status: 402 });
  }
  if (!amountsMatch(intent.amount, paypalCapturedAmount(captured))) {
    return NextResponse.json({ error: 'El monto cobrado no coincide' }, { status: 409 });
  }

  const buyerId = session.user.id;

  if (intent.kind === 'SUBSCRIPTION') {
    await recordPaidSale({
      kind: 'SUBSCRIPTION',
      buyerId,
      amountPaid: intent.amount,
      months: intent.months ?? ASSOCIATE_TERM_MONTHS,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: '/panel' });
  }

  if (intent.kind === 'COURSE' && intent.itemId) {
    const course = await prisma.course.findUnique({ where: { id: intent.itemId } });
    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    await recordPaidSale({
      kind: 'COURSE',
      buyerId,
      sellerId: course.teacherId,
      courseId: course.id,
      amountPaid: intent.amount,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: `/cursos/${course.slug}` });
  }

  if (intent.kind === 'PRODUCT' && intent.itemId) {
    const product = await prisma.product.findUnique({ where: { id: intent.itemId } });
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    await recordPaidSale({
      kind: 'PRODUCT',
      buyerId,
      sellerId: product.creatorId,
      productId: product.id,
      amountPaid: intent.amount,
      paypalOrderId: body.orderId,
    });
    return NextResponse.json({ ok: true, href: `/marketplace/${product.id}` });
  }

  return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
}
