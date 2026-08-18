import { prisma } from '@/lib/prisma';
import { periodYm } from '@/lib/commission';

export function usd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export async function juntaOverview() {
  const now = new Date();
  const month = periodYm(now);

  const [
    coursesPublished,
    coursesTotal,
    enrollments,
    associates,
    seatsActive,
    clients,
    fichasOpen,
    postsPending,
    productsPending,
    salesMonth,
    salesTotal,
    donationsPaid,
    newsletter,
    recentSales,
    recentApps,
  ] = await Promise.all([
    prisma.course.count({ where: { published: true } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.user.count({ where: { role: 'ASSOCIATE', isActive: true } }),
    prisma.platformSubscription.count({
      where: { status: 'ACTIVE', currentPeriodEnd: { gt: now } },
    }),
    prisma.user.count({ where: { role: { in: ['USER', 'MEMBER'] }, isActive: true } }),
    prisma.membershipApplication.count({ where: { status: { in: ['NEW', 'REVIEWING'] } } }),
    prisma.blogPost.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { reviewStatus: 'PENDING' } }),
    prisma.sale.aggregate({ where: { periodYm: month }, _sum: { amountPaid: true }, _count: true }),
    prisma.sale.aggregate({ _sum: { amountPaid: true } }),
    prisma.donation.aggregate({ where: { status: 'PAID' }, _sum: { total: true }, _count: true }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.sale.findMany({
      take: 8,
      orderBy: { paidAt: 'desc' },
      include: {
        buyer: { select: { name: true } },
        course: { select: { title: true } },
        product: { select: { title: true } },
      },
    }),
    prisma.membershipApplication.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, status: true, createdAt: true },
    }),
  ]);

  return {
    month,
    coursesPublished,
    coursesTotal,
    enrollments,
    associates,
    seatsActive,
    clients,
    fichasOpen,
    reviewsOpen: postsPending + productsPending,
    postsPending,
    productsPending,
    monthTotal: salesMonth._sum.amountPaid ?? 0,
    monthCount: salesMonth._count,
    allTimeTotal: salesTotal._sum.amountPaid ?? 0,
    donationsTotal: donationsPaid._sum.total ?? 0,
    donationsCount: donationsPaid._count,
    newsletter,
    recentSales,
    recentApps,
  };
}

export async function teacherOverview(userId: string) {
  const courses = await prisma.course.findMany({
    where: { teacherId: userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { enrollments: true, lessons: true } } },
  });
  const enrollments = courses.reduce((n, c) => n + c._count.enrollments, 0);
  return {
    courseCount: courses.length,
    published: courses.filter((c) => c.published).length,
    enrollments,
    lessons: courses.reduce((n, c) => n + c._count.lessons, 0),
    courses,
  };
}

export async function associateOverview(userId: string) {
  const month = periodYm();
  const [products, monthSales, enrollments] = await Promise.all([
    prisma.product.findMany({
      where: { creatorId: userId },
      select: { published: true, reviewStatus: true },
    }),
    prisma.sale.aggregate({
      where: { sellerId: userId, periodYm: month },
      _sum: { sellerAmount: true },
      _count: true,
    }),
    prisma.enrollment.count({ where: { userId } }),
  ]);
  return {
    productsPublished: products.filter((p) => p.published).length,
    productsPending: products.filter((p) => p.reviewStatus === 'PENDING').length,
    monthEarn: monthSales._sum.sellerAmount ?? 0,
    monthSales: monthSales._count,
    enrollments,
  };
}

export async function memberOverview(userId: string) {
  const [enrollments, purchases] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.purchase.count({ where: { buyerId: userId } }),
  ]);
  return { enrollments, purchases };
}
