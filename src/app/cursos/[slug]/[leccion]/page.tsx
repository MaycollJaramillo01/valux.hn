import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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
      sections: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, include: { resources: { orderBy: { order: 'asc' } } } } },
      },
      lessons: {
        where: { sectionId: null },
        orderBy: { order: 'asc' },
        include: { resources: { orderBy: { order: 'asc' } } },
      },
      enrollments: { where: { userId: session.user.id } },
    },
  });
  if (!course) notFound();

  // Profesor del curso y admins entran sin inscripción.
  const role = (session.user as { role?: string }).role;
  const isStaff = role === 'ADMIN' || (role === 'TEACHER' && course.teacherId === session.user.id);
  if (course.enrollments.length === 0 && !isStaff) redirect(`/cursos/${slug}`);

  // Lista plana ordenada (secciones primero, luego sueltas) para prev/next.
  const flat = [...course.sections.flatMap((s) => s.lessons), ...course.lessons];
  const idx = flat.findIndex((l) => l.slug === leccion);
  if (idx === -1) notFound();
  const lesson = flat[idx];
  const prev = flat[idx - 1];
  const next = flat[idx + 1];

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lessonId: { in: flat.map((l) => l.id) } },
  });
  const doneIds = new Set(progress.map((p) => p.lessonId));
  const myProgress = progress.find((p) => p.lessonId === lesson.id);

  async function markComplete() {
    'use server';
    const session = await auth();
    if (!session?.user) redirect(`/login?callbackUrl=/cursos/${slug}/${leccion}`);
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
      update: {},
      create: { userId: session.user.id, lessonId: lesson.id },
    });
    revalidatePath(`/cursos/${slug}/${leccion}`);
    if (next) redirect(`/cursos/${slug}/${next.slug}`);
  }

  const sideSections: { title: string | null; lessons: typeof flat }[] = [
    ...course.sections.map((s) => ({ title: s.title, lessons: s.lessons })),
    ...(course.lessons.length ? [{ title: null, lessons: course.lessons }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="course-shell">
          <div className="player-grid">
            <div className="player-main">
              <div className="player-head">
                <a href={`/cursos/${course.slug}`}>← {course.title}</a>
                <span>
                  {lesson.points} pts
                  {myProgress?.score != null ? ` · Nota: ${myProgress.score}/100` : ''}
                </span>
              </div>
              <div className="player-body">
                <h1>{lesson.title}</h1>

                {/* Compatibilidad: el campo videoUrl original se muestra como recurso de video */}
                {lesson.videoUrl && (
                  <div className="resource-block">
                    <div className="resource-block-head">
                      <span className="resource-kind">VIDEO</span>
                      <span data-es="Clase en video" data-en="Video lesson">Clase en video</span>
                    </div>
                    <video controls playsInline preload="metadata">
                      <source src={lesson.videoUrl} type="video/mp4" />
                    </video>
                  </div>
                )}

                {lesson.resources.map((r) => (
                  <div key={r.id} className="resource-block">
                    <div className="resource-block-head">
                      <span className="resource-kind">{r.type}</span>
                      <span>{r.title}</span>
                    </div>
                    {r.type === 'VIDEO' && r.url && (
                      <video controls playsInline preload="metadata">
                        <source src={r.url} type="video/mp4" />
                      </video>
                    )}
                    {r.type === 'IMAGE' && r.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.url} alt={r.title} />
                    )}
                    {r.type === 'PDF' && r.url && <iframe src={r.url} title={r.title} />}
                    {r.type === 'LINK' && r.url && (
                      <a className="resource-link" href={r.url} target="_blank" rel="noopener noreferrer">
                        <span>{r.url}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {r.type === 'TEXT' && r.content && <div className="resource-text">{r.content}</div>}
                  </div>
                ))}

                {lesson.content && (
                  <div className="resource-block">
                    <div className="resource-block-head">
                      <span className="resource-kind">TEXT</span>
                      <span data-es="Apuntes de la lección" data-en="Lesson notes">Apuntes de la lección</span>
                    </div>
                    <div className="resource-text">{lesson.content}</div>
                  </div>
                )}

                <div className="player-actions">
                  <div>
                    {prev ? (
                      <a href={`/cursos/${course.slug}/${prev.slug}`} className="btn btn-ghost btn-sm">
                        ← <span data-es="Anterior" data-en="Previous">Anterior</span>
                      </a>
                    ) : null}
                  </div>
                  {doneIds.has(lesson.id) ? (
                    <span className="lesson-done-badge">
                      ✓ <span data-es="Lección completada" data-en="Lesson completed">Lección completada</span>
                    </span>
                  ) : (
                    <form action={markComplete}>
                      <button type="submit" className="btn btn-primary">
                        <span data-es="Marcar como completada" data-en="Mark as complete">Marcar como completada</span>
                        <span className="btn-glyph" aria-hidden="true">✓</span>
                      </button>
                    </form>
                  )}
                  <div>
                    {next ? (
                      <a href={`/cursos/${course.slug}/${next.slug}`} className="btn btn-ghost btn-sm">
                        <span data-es="Siguiente" data-en="Next">Siguiente</span> →
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <aside className="player-side">
              <div className="player-side-head" data-es="Contenido del curso" data-en="Course content">
                Contenido del curso
              </div>
              {sideSections.map((s, i) => (
                <div key={i}>
                  {s.title && <div className="side-section">{i + 1}. {s.title}</div>}
                  {s.lessons.map((l) => (
                    <a
                      key={l.id}
                      href={`/cursos/${course.slug}/${l.slug}`}
                      className={`lesson-row${doneIds.has(l.id) ? ' is-done' : ''}${l.id === lesson.id ? ' is-current' : ''}`}
                    >
                      <span className="lesson-check">{doneIds.has(l.id) ? '✓' : ''}</span>
                      <span className="lesson-name">{l.title}</span>
                      <span className="lesson-tags">
                        {l.duration ? <span>{l.duration}m</span> : null}
                      </span>
                    </a>
                  ))}
                </div>
              ))}
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
