import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Lección - VALUX' };
export const dynamic = 'force-dynamic';

export default async function LessonPlayerPage({ params }: { params: Promise<{ slug: string, lessonSlug: string }> }) {
  const { slug, lessonSlug } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect(`/login?callbackUrl=/cursos/${slug}/${lessonSlug}`);
  }

  const role = (session.user as { role?: string }).role;
  const isAdminOrTeacher = role === 'ADMIN' || role === 'TEACHER';

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      enrollments: { where: { userId: session.user.id } }
    }
  });

  if (!course) {
    redirect('/cursos');
  }

  const isEnrolled = course.enrollments.length > 0;
  if (!isEnrolled && !isAdminOrTeacher) {
    redirect(`/cursos/${slug}`);
  }

  const lessonIndex = course.lessons.findIndex(l => l.slug === lessonSlug);
  const lesson = course.lessons[lessonIndex];

  if (!lesson) {
    redirect(`/cursos/${slug}`);
  }

  const prevLesson = course.lessons[lessonIndex - 1];
  const nextLesson = course.lessons[lessonIndex + 1];

  const userProgress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lessonId: { in: course.lessons.map(l => l.id) } }
  });
  const completedLessonIds = new Set(userProgress.map(p => p.lessonId));
  const isCompleted = completedLessonIds.has(lesson.id);

  async function markAsCompleted() {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
      update: {},
      create: { userId: session.user.id, lessonId: lesson.id }
    });

    revalidatePath(`/cursos/${slug}/${lessonSlug}`);
    
    if (nextLesson) {
      redirect(`/cursos/${slug}/${nextLesson.slug}`);
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {/* Contenedor principal a dos columnas */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', gap: '2rem' }}>
          
          {/* COLUMNA IZQUIERDA: Área de Video y Contenido */}
          <section style={{ flex: '1' }}>
            <header style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <a href={`/cursos/${slug}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                  ← {course.title}
                </a>
              </p>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
                {lesson.order}. {lesson.title}
              </h1>
            </header>

            {/* Reproductor de Video */}
            {lesson.videoUrl ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#000', borderRadius: '8px', marginBottom: '2rem' }}>
                <iframe 
                  src={lesson.videoUrl} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title={lesson.title}
                ></iframe>
              </div>
            ) : (
              <div style={{ padding: '3rem', backgroundColor: '#e2e8f0', borderRadius: '8px', textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ color: '#64748b', margin: 0 }}>Esta lección no contiene video.</p>
              </div>
            )}

            {/* Contenido de la Lección y Botón de Completar */}
            <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6', marginBottom: '2rem' }}>
                {lesson.content}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {prevLesson && (
                    <a href={`/cursos/${slug}/${prevLesson.slug}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      ← Lección anterior
                    </a>
                  )}
                </div>
                
                <form action={markAsCompleted}>
                  {isCompleted ? (
                    <button type="button" disabled style={{ padding: '0.75rem 1.5rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', fontWeight: 'bold', cursor: 'default' }}>
                      ✓ Completada
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
                      Marcar como completada {nextLesson && 'y continuar'}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: Temario del Curso (Sidebar) */}
          <aside style={{ width: '100%', maxWidth: '350px', flexShrink: 0 }}>
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                Temario del curso
              </h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {course.lessons.map((l) => {
                  const isActive = l.id === lesson.id;
                  const isDone = completedLessonIds.has(l.id);
                  
                  return (
                    <li key={l.id} style={{ marginBottom: '0.5rem' }}>
                      <a 
                        href={`/cursos/${slug}/${l.slug}`}
                        style={{ 
                          display: 'flex', 
                          gap: '0.75rem', 
                          padding: '0.75rem', 
                          borderRadius: '6px', 
                          backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                          color: isActive ? '#0f172a' : '#64748b',
                          textDecoration: 'none',
                          alignItems: 'center',
                          borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: isDone ? '#22c55e' : (isActive ? '#2563eb' : '#cbd5e1'), 
                          color: '#fff', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {isDone ? '✓' : l.order}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: isActive ? '600' : '400', lineHeight: '1.4' }}>
                          {l.title}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}