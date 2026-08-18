import { prisma } from '@/lib/prisma';
import { periodYm, splitPrice } from '@/lib/commission';
import { getSettings } from '@/lib/access';
import type { SaleKind } from '@prisma/client';

export async function recordPaidSale(opts: {
  kind: SaleKind;
  buyerId: string;
  sellerId?: string | null;
  courseId?: string | null;
  productId?: string | null;
  amountPaid: number;
  months?: number;
  paypalOrderId?: string | null;
}) {
  const settings = await getSettings();
  const split = splitPrice(opts.amountPaid, settings.commissionPercent);
  const sellerId = opts.kind === 'SUBSCRIPTION' ? null : opts.sellerId ?? null;
  const sellerAmount = sellerId ? split.sellerAmount : 0;
  const valuxFee = sellerId ? split.valuxFee : split.amount;
  const paidAt = new Date();
  const ym = periodYm(paidAt);

  const sale = await prisma.sale.create({
    data: {
      kind: opts.kind,
      buyerId: opts.buyerId,
      sellerId,
      courseId: opts.courseId ?? null,
      productId: opts.productId ?? null,
      amountPaid: split.amount,
      valuxFee,
      sellerAmount,
      paypalOrderId: opts.paypalOrderId ?? null,
      paidAt,
      periodYm: ym,
    },
  });

  if (sellerId && sellerAmount > 0) {
    const dueAt = new Date(paidAt.getFullYear(), paidAt.getMonth() + 1, 10, 23, 59, 59);
    await prisma.monthlyPayout.upsert({
      where: { sellerId_periodYm: { sellerId, periodYm: ym } },
      update: { amountDue: { increment: sellerAmount } },
      create: { sellerId, periodYm: ym, amountDue: sellerAmount, dueAt },
    });
  }

  if (opts.kind === 'COURSE' && opts.courseId) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: opts.buyerId, courseId: opts.courseId } },
      update: {},
      create: { userId: opts.buyerId, courseId: opts.courseId },
    });
  }

  if (opts.kind === 'PRODUCT' && opts.productId) {
    await prisma.purchase.upsert({
      where: { buyerId_productId: { buyerId: opts.buyerId, productId: opts.productId } },
      update: { amountPaid: split.amount, valuxFee },
      create: {
        buyerId: opts.buyerId,
        productId: opts.productId,
        amountPaid: split.amount,
        valuxFee,
      },
    });
  }

  if (opts.kind === 'SUBSCRIPTION') {
    const months = opts.months && opts.months > 0 ? opts.months : 12;
    const user = await prisma.user.findUnique({
      where: { id: opts.buyerId },
      select: { role: true },
    });
    if (user && (user.role === 'USER' || user.role === 'MEMBER')) {
      await prisma.user.update({
        where: { id: opts.buyerId },
        data: { role: 'ASSOCIATE' },
      });
    }
    const latest = await prisma.platformSubscription.findFirst({
      where: { userId: opts.buyerId, status: 'ACTIVE' },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    const base =
      latest && latest.currentPeriodEnd > paidAt ? latest.currentPeriodEnd : paidAt;
    const periodEnd = new Date(base);
    periodEnd.setMonth(periodEnd.getMonth() + months);
    await prisma.platformSubscription.create({
      data: {
        userId: opts.buyerId,
        status: 'ACTIVE',
        startedAt: paidAt,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  return sale;
}
