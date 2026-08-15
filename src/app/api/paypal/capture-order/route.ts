import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { capturePaypalOrder, paypalConfigured } from '@/lib/paypal';
import { recordPaidSale } from '@/lib/fulfill';
import { getSettings } from '@/lib/access';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debés iniciar sesión' }, { status: 401 });
  }
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'PayPal aún no está configurado' }, { status: 503 });
  }

  const body = (await request.json()) as { orderId?: string; kind?: string; id?: string };
  if (!body.orderId || !body.kind) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const captured = await capturePaypalOrder(body.orderId);
  if (captured.status !== 'COMPLETED' && captured.status !== 'APPROVED') {
    return NextResponse.json({ error: 'El pago no se completó' }, { status: 402 });
  }

  const buyerId = session.user.id;

  if (body.kind === 'SUBSCRIPTION') {
    const settings = await getSettings();
    await recordPaidSale({
      kind: 'SUBSCRIPTION',
      buyerId,
      amountPaid: settings.subscriptionPrice,
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
