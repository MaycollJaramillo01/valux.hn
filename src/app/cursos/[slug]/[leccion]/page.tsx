import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; leccion: string }>;
}) {
  const { slug, leccion } = await params;

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/cursos/${slug}/${leccion}`);

  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      enrollments: { where: { userId: session.user.id } },
    },
  });
  if (!course) notFound();
  if (course.enrollments.length === 0) redirect(`/cursos/${slug}`);

  const lessonIndex = course.lessons.findIndex((l) => l.slug === leccion);
  if (lessonIndex === -1) notFound();
  const lesson = course.lessons[lessonIndex];
  const prev = course.lessons[lessonIndex - 1];
  const next = course.lessons[lessonIndex + 1];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container container-narrow">
            <div className="section-head center">
              <span className="eyebrow">
                <a href={`/cursos/${course.slug}`}>{course.title}</a>
              </span>
              <h2>{lesson.title}</h2>
            </div>

            {lesson.videoUrl && (
              <figure className="video-slab" style={{ marginBottom: '2rem' }}>
                <video controls playsInline preload="metadata">
                  <source src={lesson.videoUrl} type="video/mp4" />
                </video>
              </figure>
            )}

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{lesson.content}</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
              {prev ? (
                <a href={`/cursos/${course.slug}/${prev.slug}`} className="btn btn-ghost">
                  ← <span data-es="Anterior" data-en="Previous">Anterior</span>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={`/cursos/${course.slug}/${next.slug}`} className="btn btn-primary">
                  <span data-es="Siguiente" data-en="Next">Siguiente</span>
                  <span className="arrow">→</span>
                </a>
              ) : (
                <a href={`/cursos/${course.slug}`} className="btn btn-primary">
                  <span data-es="Volver al curso" data-en="Back to course">Volver al curso</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
