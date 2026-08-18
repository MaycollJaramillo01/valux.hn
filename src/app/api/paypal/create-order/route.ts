import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPaypalOrder, parseAssociateMonths, parseDonationPledge, paypalConfigured } from '@/lib/paypal';
import { getSettings } from '@/lib/access';

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
    await prisma.donation.create({
      data: {
        monthlyAmount: pledge.monthlyAmount,
        months: pledge.months,
        total: pledge.total,
        paypalOrderId: order.id,
      },
    });
    return NextResponse.json({ id: order.id });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }

  let amount = 0;
  let description = 'VALUX';

  if (body.kind === 'SUBSCRIPTION') {
    const months = parseAssociateMonths(body.months);
    if (!months) {
      return NextResponse.json({ error: 'Elegí un compromiso de 3, 6 o 12 meses' }, { status: 400 });
    }
    const settings = await getSettings();
    const monthly = settings.subscriptionPrice;
    if (monthly <= 0) {
      return NextResponse.json({ error: 'Este ítem no requiere pago' }, { status: 400 });
    }
    amount = Math.round(monthly * months * 100) / 100;
    description = `Asociación VALUX · $${monthly.toFixed(2)}/mes × ${months} meses`;
    const order = await createPaypalOrder(amount, description, `assoc:${session.user.id}:${months}`);
    return NextResponse.json({ id: order.id });
  } else if (body.kind === 'COURSE' && body.id) {
    const course = await prisma.course.findUnique({ where: { id: body.id } });
    if (!course || !course.published) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    amount = course.price;
    description = `Curso: ${course.title}`;
  } else if (body.kind === 'PRODUCT' && body.id) {
    const product = await prisma.product.findUnique({ where: { id: body.id } });
    if (!product || !product.published) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    amount = product.price;
    description = `Marketplace: ${product.title}`;
  } else {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'Este ítem no requiere pago' }, { status: 400 });
  }

  const order = await createPaypalOrder(amount, description);
  return NextResponse.json({ id: order.id });
}
