import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canTeachCourses } from '@/lib/access';
import { getSettings } from '@/lib/access';
import { slugify } from '@/lib/commission';
import PriceSplitField from '@/components/PriceSplitField';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Nuevo curso' };

export default async function NuevoCursoPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !canTeachCourses(role)) redirect('/panel');
  const settings = await getSettings();

  async function createCourse(formData: FormData) {
    'use server';
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || !canTeachCourses(role)) return;
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const price = Number(formData.get('price'));
    const videoUrl = String(formData.get('videoUrl') || '').trim();
    if (!title || !description) return;
    let slug = slugify(title);
    let i = 1;
    while (await prisma.course.findUnique({ where: { slug } })) slug = `${slugify(title)}-${i++}`;
    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: Number.isFinite(price) ? price : 0,
        slug,
        published: true,
        teacherId: session.user.id,
      },
    });
    if (videoUrl) {
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          slug: 'introduccion',
          title: 'Introducción',
          content: 'Primera lección del curso.',
          videoUrl,
          order: 1,
        },
      });
    }
    redirect(`/panel/${course.slug}`);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Nuevo curso</h1>
      <p style={{ color: '#475569' }}>Título, precio y primera lección.</p>
      <form action={createCourse} style={{ display: 'grid', gap: '1rem', background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <input name="title" required placeholder="Título del curso" style={{ padding: '0.75rem' }} />
        <textarea name="description" required rows={5} placeholder="Descripción" style={{ padding: '0.75rem' }} />
        <input name="videoUrl" placeholder="URL de video de la primera lección (opcional)" style={{ padding: '0.75rem' }} />
        <PriceSplitField commissionPercent={settings.commissionPercent} />
        <button className="btn btn-primary" type="submit">Publicar curso</button>
      </form>
    </div>
  );
}
