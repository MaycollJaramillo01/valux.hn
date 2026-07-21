import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Editar Lección - VALUX' };
export const dynamic = 'force-dynamic';

export default async function EditLessonPage({ params }: { params: Promise<{ slug: string, lessonSlug: string }> }) {
  const { slug, lessonSlug } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=/panel/${slug}/${lessonSlug}/editar`);
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'TEACHER' && role !== 'ADMIN') {
    redirect('/cursos');
  }

  const course = await prisma.course.findUnique({
    where: { slug }
  });

  if (!course || (role !== 'ADMIN' && course.teacherId !== session.user.id)) {
    redirect('/panel/docencia');
  }

  const lesson = await prisma.lesson.findFirst({
    where: { courseId: course.id, slug: lessonSlug }
  });

  if (!lesson) {
    redirect(`/panel/${slug}`);
  }

  async function updateLesson(formData: FormData) {
    'use server';
    
    const session = await auth();
    if (!session?.user) return;
    const role = (session.user as { role?: string }).role;
    if (role !== 'TEACHER' && role !== 'ADMIN') return;

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const videoUrl = formData.get('videoUrl') as string;

    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    await prisma.lesson.update({
      where: { id: lesson!.id },
      data: {
        title,
        content,
        videoUrl,
        slug: newSlug
      }
    });

    redirect(`/panel/${slug}`);
  }

  async function deleteLesson() {
    'use server';
    
    const session = await auth();
    if (!session?.user) return;
    const role = (session.user as { role?: string }).role;
    if (role !== 'TEACHER' && role !== 'ADMIN') return;

    await prisma.lesson.delete({
      where: { id: lesson!.id }
    });

    redirect(`/panel/${slug}`);
  }

  return (
    <>
      <SiteHeader />
      <main id="main" style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '3rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          <header style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <a href={`/panel/${slug}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                ← Volver al temario
              </a>
            </p>
            <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem' }}>
              Editar Lección
            </h1>
            <p style={{ color: '#475569', fontSize: '1.125rem' }}>
              Curso: <strong>{course.title}</strong>
            </p>
          </header>

          <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <form action={updateLesson} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="title" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  Título de la lección
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  defaultValue={lesson.title}
                  style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="videoUrl" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  URL del Video
                </label>
                <input 
                  type="url" 
                  id="videoUrl" 
                  name="videoUrl" 
                  defaultValue={lesson.videoUrl || ''}
                  style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="content" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                  Descripción o contenido de la clase
                </label>
                <textarea 
                  id="content" 
                  name="content" 
                  rows={6} 
                  defaultValue={lesson.content}
                  style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', fontFamily: 'inherit' }}
                  required
                ></textarea>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Guardar Cambios
                </button>
                <a href={`/panel/${slug}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
                  Cancelar
                </a>
              </div>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

            {/* Zona de peligro: Eliminar lección */}
            <div style={{ backgroundColor: '#fef2f2', padding: '1.5rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
              <h3 style={{ color: '#991b1b', margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>Zona de Peligro</h3>
              <p style={{ color: '#7f1d1d', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Eliminar esta lección borrará permanentemente su contenido y el progreso de los estudiantes asociado a ella.
              </p>
              <form action={deleteLesson}>
                <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Eliminar Lección Definitivamente
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}