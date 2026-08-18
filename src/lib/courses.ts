import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteManagedCourse(opts: {
  courseId: string;
  userId: string;
  role?: string | null;
}) {
  if (opts.role !== 'TEACHER' && opts.role !== 'ADMIN') return false;
  const course = await prisma.course.findUnique({
    where: { id: opts.courseId },
    select: { id: true, slug: true, teacherId: true },
  });
  if (!course) return false;
  if (opts.role !== 'ADMIN' && course.teacherId !== opts.userId) return false;

  await prisma.course.delete({ where: { id: course.id } });
  revalidatePath('/panel/docencia');
  revalidatePath('/catalogo');
  revalidatePath(`/cursos/${course.slug}`);
  revalidatePath(`/panel/${course.slug}`);
  return true;
}
