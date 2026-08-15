import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type ValuxRole = 'USER' | 'MEMBER' | 'ASSOCIATE' | 'TEACHER' | 'ADMIN' | 'PUBLIC';

export function roleLabel(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Junta directiva';
    case 'ASSOCIATE':
      return 'Asociado';
    case 'TEACHER':
      return 'Profesor';
    case 'MEMBER':
      return 'Suscriptor';
    default:
      return 'Usuario';
  }
}

export function isJunta(role?: string | null) {
  return role === 'ADMIN';
}

export function isAssociate(role?: string | null) {
  return role === 'ASSOCIATE';
}

export function isTeacher(role?: string | null) {
  return role === 'TEACHER';
}

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, paypalEmail: true },
  });
}

export async function hasActiveSubscription(userId: string) {
  const now = new Date();
  const sub = await prisma.platformSubscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: now },
    },
    orderBy: { currentPeriodEnd: 'desc' },
  });
  return Boolean(sub);
}

/** Asociado, junta o suscripción de plataforma activa (MEMBER legacy). No incluye profesor. */
export async function hasFullCatalogAccess(userId: string, role?: string | null) {
  if (role === 'ADMIN' || role === 'ASSOCIATE' || role === 'MEMBER') return true;
  return hasActiveSubscription(userId);
}

export async function canAccessCourse(opts: {
  userId: string;
  role?: string | null;
  courseId: string;
  teacherId?: string | null;
}) {
  const { userId, role, courseId, teacherId } = opts;
  if (role === 'ADMIN') return true;
  if (role === 'TEACHER' && teacherId === userId) return true;
  if (await hasFullCatalogAccess(userId, role)) return true;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return Boolean(enrollment);
}

export async function canAccessProduct(opts: {
  userId: string;
  role?: string | null;
  productId: string;
  creatorId?: string | null;
}) {
  const { userId, role, productId, creatorId } = opts;
  if (role === 'ADMIN') return true;
  if (creatorId === userId) return true;
  if (await hasFullCatalogAccess(userId, role)) return true;
  const purchase = await prisma.purchase.findUnique({
    where: { buyerId_productId: { buyerId: userId, productId } },
  });
  return Boolean(purchase);
}

export function canWriteBlog(role?: string | null) {
  return role === 'ASSOCIATE' || role === 'ADMIN';
}

export function canPublishDirect(role?: string | null) {
  return role === 'ADMIN';
}

export function canSellProducts(role?: string | null) {
  return role === 'ASSOCIATE' || role === 'ADMIN';
}

export function canTeachCourses(role?: string | null) {
  return role === 'TEACHER' || role === 'ADMIN';
}

export async function getSettings() {
  return prisma.platformSettings.upsert({
    where: { id: 'valux' },
    update: {},
    create: { id: 'valux', commissionPercent: 30, subscriptionPrice: 19 },
  });
}
