import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Nueva Lección - VALUX' };
export const dynamic = 'force-dynamic';

export default async function NewLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=/panel/${slug}/nueva-leccion`);
  }

  const role = (session.user as { role?: string }).role;
  if (role !== 'TEACHER' && role !== 'ADMIN') {
    redirect('/cursos');
  }

  const course = await prisma.course.findUnique({
    where: { slug }
  });

  if (!course) {
    redirect('/panel/docencia');
  }

  if (role !== 'ADMIN' && course.teacherId !== session.user.id) {
    redirect('/panel/docencia');
  }

  async function createLesson(formData: FormData) {
    'use server';
    
    const session = await auth();
    if (!session?.user) return;
    const role = (session.user as { role?: string }).role;
    if (role !== 'TEACHER' && role !== 'ADMIN') return;

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const videoUrl = formData.get('videoUrl') as string;

    const lessonSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId: course!.id },
      orderBy: { order: 'desc' }
    });
    
    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        slug: lessonSlug,
        order: nextOrder,
        courseId: course!.id
      }
    });

    redirect(`/panel/${slug}`);
  }

  return (
    <>
      <main style={{ padding: 0 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          <header style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <a href={`/panel/${slug}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                ← Volver al curso
              </a>
            </p>
            <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem' }}>
              Nueva Lección
            </h1>
            <p style={{ color: '#475569', fontSize: '1.125rem' }}>
              Añadiendo contenido a: <strong>{course.title}</strong>
            </p>
          </header>

          <form action={createLesson} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="title" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                Título de la lección
              </label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                placeholder="Ej. 1. Introducción a los conceptos básicos"
                style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'inherit' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="videoUrl" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                URL del Video (YouTube, Vimeo, Mux, etc.)
              </label>
              <input 
                type="url" 
                id="videoUrl" 
                name="videoUrl" 
                placeholder="https://youtu.be/..."
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
                placeholder="Escribe un resumen de lo que se verá en esta lección o añade enlaces útiles..."
                style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', fontFamily: 'inherit' }}
                required
              ></textarea>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold', cursor: 'pointer' }}>
                Guardar Lección
              </button>
              <a href={`/panel/${slug}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
                Cancelar
              </a>
            </div>

          </form>
        </div>
      </main>
    </>
  );
}