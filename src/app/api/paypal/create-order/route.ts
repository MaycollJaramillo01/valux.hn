import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPaypalOrder, paypalConfigured } from '@/lib/paypal';
import { getSettings } from '@/lib/access';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal aún no está configurado' }, { status: 503 });
  }

  const body = (await request.json()) as { kind?: string; id?: string };
  let amount = 0;
  let description = 'VALUX';

  if (body.kind === 'SUBSCRIPTION') {
    const settings = await getSettings();
    amount = settings.subscriptionPrice;
    description = 'Suscripción VALUX — acceso a todo';
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
