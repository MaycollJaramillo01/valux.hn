import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ASSOCIATE_TERM_MONTHS, createPaypalOrder, parseDonationPledge, paypalConfigured } from '@/lib/paypal';
import { getSettings } from '@/lib/access';

async function rememberIntent(data: {
  paypalOrderId: string;
  kind: string;
  amount: number;
  itemId?: string;
  buyerId?: string;
  months?: number;
}) {
  await prisma.paypalIntent.create({ data });
}

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal aún no está configurado' }, { status: 503 });
  }

  let body: { kind?: string; id?: string; amount?: number; months?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (body.kind === 'DONATION') {
    const pledge = parseDonationPledge(body.amount, body.months);
    if (!pledge) {
      return NextResponse.json({ error: 'Monto o compromiso inválido' }, { status: 400 });
    }
    const description = `Donación VALUX · $${pledge.monthlyAmount.toFixed(2)}/mes × ${pledge.months} meses`;
    const order = await createPaypalOrder(pledge.total, description);
    const donation = await prisma.donation.create({
      data: {
        monthlyAmount: pledge.monthlyAmount,
        months: pledge.months,
        total: pledge.total,
        paypalOrderId: order.id,
      },
    });
    await rememberIntent({
      paypalOrderId: order.id,
      kind: 'DONATION',
      itemId: donation.id,
      amount: pledge.total,
      months: pledge.months,
    });
    return NextResponse.json({ id: order.id });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }

  if (body.kind === 'SUBSCRIPTION') {
    const months = ASSOCIATE_TERM_MONTHS;
    const settings = await getSettings();
    const monthly = settings.subscriptionPrice;
    if (monthly <= 0) {
      return NextResponse.json({ error: 'Este ítem no requiere pago' }, { status: 400 });
    }
    const amount = Math.round(monthly * months * 100) / 100;
    const description = `Asociación VALUX · $${monthly.toFixed(2)}/mes × 1 año`;
    const order = await createPaypalOrder(amount, description, `assoc:${session.user.id}:${months}`);
    await rememberIntent({
      paypalOrderId: order.id,
      kind: 'SUBSCRIPTION',
      buyerId: session.user.id,
      amount,
      months,
    });
    return NextResponse.json({ id: order.id });
  }

  if (body.kind === 'COURSE' && body.id) {
    const course = await prisma.course.findUnique({ where: { id: body.id } });
    if (!course || !course.published) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    if (course.price <= 0) return NextResponse.json({ error: 'Este ítem no requiere pago' }, { status: 400 });
    const order = await createPaypalOrder(
      course.price,
      `Curso: ${course.title}`,
      `course:${session.user.id}:${course.id}`
    );
    await rememberIntent({
      paypalOrderId: order.id,
      kind: 'COURSE',
      itemId: course.id,
      buyerId: session.user.id,
      amount: course.price,
    });
    return NextResponse.json({ id: order.id });
  }

  if (body.kind === 'PRODUCT' && body.id) {
    const product = await prisma.product.findUnique({ where: { id: body.id } });
    if (!product || !product.published) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    if (product.price <= 0) return NextResponse.json({ error: 'Este ítem no requiere pago' }, { status: 400 });
    const order = await createPaypalOrder(
      product.price,
      `Marketplace: ${product.title}`,
      `product:${session.user.id}:${product.id}`
    );
    await rememberIntent({
      paypalOrderId: order.id,
      kind: 'PRODUCT',
      itemId: product.id,
      buyerId: session.user.id,
      amount: product.price,
    });
    return NextResponse.json({ id: order.id });
  }

  return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
}
