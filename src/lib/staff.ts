import { prisma } from '@/lib/prisma';

export const ASSOCIATION_ROLES = ['ASSOCIATE', 'TEACHER', 'ADMIN'] as const;
export const STAFF_ROLES = ['USER', 'ASSOCIATE', 'TEACHER', 'ADMIN'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isAssociationRole(role?: string | null) {
  return ASSOCIATION_ROLES.includes(role as (typeof ASSOCIATION_ROLES)[number]);
}

export function parseStaffRole(value: FormDataEntryValue | null): StaffRole | null {
  const role = String(value || '');
  return STAFF_ROLES.includes(role as StaffRole) ? (role as StaffRole) : null;
}

export async function activeAdminCount(exceptId?: string) {
  return prisma.user.count({
    where: {
      role: 'ADMIN',
      isActive: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
  });
}

export async function wouldLeaveNoAdmin(opts: {
  targetId: string;
  nextRole?: StaffRole;
  nextActive?: boolean;
}) {
  const target = await prisma.user.findUnique({
    where: { id: opts.targetId },
    select: { id: true, role: true, isActive: true },
  });
  if (!target || target.role !== 'ADMIN' || !target.isActive) return false;
  const stillAdmin = (opts.nextRole ?? target.role) === 'ADMIN';
  const stillActive = opts.nextActive ?? target.isActive;
  if (stillAdmin && stillActive) return false;
  return (await activeAdminCount(target.id)) < 1;
}
