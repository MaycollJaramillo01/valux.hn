import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasFullCatalogAccess } from '@/lib/access';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

type LessonLite = {
  id: string;
  slug: string;
  title: string;
  points: number;
  duration: number | null;
};

function LessonRow({
  lesson,
  courseSlug,
  done,
  enrolled,
}: {
  lesson: LessonLite;
  courseSlug: string;
  done: boolean;
  enrolled: boolean;
}) {
  const inner = (
    <>
      <span className="lesson-check">{done ? '✓' : ''}</span>
      <span className="lesson-name">{lesson.title}</span>
      <span className="lesson-tags">
        {lesson.duration ? <span>{lesson.duration} min</span> : null}
        <span className="pts">{lesson.points} pts</span>
        {!enrolled && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>Bloqueada</span>}
      </span>
    </>
  );

  if (!enrolled) {
    return <div className="lesson-row is-locked" style={{ opacity: 0.6, cursor: 'not-allowed' }}>{inner}</div>;
  }
  return (
    <a href={`/cursos/${courseSlug}/${lesson.slug}`} className={`lesson-row${done ? ' is-done' : ''}`}>
      {inner}
    </a>
  );
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  // 1. EVALUAR ROL DEL USUARIO EN LA VISTA
  const userRole = (session?.user as { role?: string })?.role ?? 'PUBLIC';
  const fullAccess = session?.user
    ? await hasFullCatalogAccess(session.user.id, userRole)
    : false;

  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      teacher: { select: { name: true } },
      sections: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } },
      lessons: { where: { sectionId: null }, orderBy: { order: 'asc' } },
    },
  });
  
  if (!course) notFound();

  const enrollment = session?.user
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
      })
    : null;

  const allLessons: LessonLite[] = [
    ...course.sections.flatMap((s) => s.lessons),
    ...course.lessons,
  ];
  const totalPoints = allLessons.reduce((sum, l) => sum + l.points, 0);

  const doneIds = new Set(
    session?.user
      ? (
          await prisma.lessonProgress.findMany({
            where: { userId: session.user.id, lessonId: { in: allLessons.map((l) => l.id) } },
            select: { lessonId: true },
          })
        ).map((p) => p.lessonId)
      : []
  );
  
  const doneCount = allLessons.filter((l) => doneIds.has(l.id)).length;
  const pct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  // 2. SERVER ACTION PROTEGIDO (EL PORTERO)
  async function enroll() {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user) redirect(`/login?callbackUrl=/cursos/${slug}`);

    const role = (currentSession.user as { role?: string }).role ?? 'USER';
    const privileged = await hasFullCatalogAccess(currentSession.user.id, role);

    if (!privileged && course!.price > 0) {
      redirect(`/checkout?kind=COURSE&id=${course!.id}`);
    }

    // Si pasa la validación (es Miembro o el curso es gratis), se inscribe
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: currentSession.user.id, courseId: course!.id } },
      update: {},
      create: { userId: currentSession.user.id, courseId: course!.id },
    });
    revalidatePath(`/cursos/${slug}`);
  }

  const enrolled =
    Boolean(enrollment) ||
    fullAccess ||
    (session?.user && userRole === 'TEACHER' && course.teacherId === session.user.id) ||
    userRole === 'ADMIN';

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="course-shell">
          <div className="container-narrow">
            <p className="course-eyebrow">
              VX / <span data-es="Curso" data-en="Course">Curso</span>
              {course.teacher ? ` · ${course.teacher.name}` : ''}
            </p>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-lead">{course.description}</p>

            {enrolled ? (
              // VISTA: MATRICULADO
              <div>
                <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
                <p className="progress-label">
                  {doneCount} / {allLessons.length} lecciones completadas
                  {' · '}{pct}% · {totalPoints} pts en juego
                  {enrollment?.finalGrade != null && (
                    <>
                      {' · '}Nota final: <strong>{enrollment.finalGrade}/100</strong>
                    </>
                  )}
                </p>
              </div>
            ) : (
              // 3. VISTA: BOTONES DE COMPRA O ACCESO GRATUITO SEGÚN EL ROL
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '2rem 0' }}>
                {fullAccess ? (
                  <form action={enroll}>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ backgroundColor: '#111', borderColor: '#111' }}>
                      Acceder (incluido en tu acceso VALUX) <span aria-hidden="true">→</span>
                    </button>
                  </form>
                ) : (
                  <>
                    <form action={enroll}>
                      <button type="submit" className="btn btn-primary btn-lg">
                        {course.price > 0 ? `Comprar curso por $${course.price} USD` : 'Inscribirme gratis'}
                        <span aria-hidden="true" style={{ marginLeft: '8px' }}>→</span>
                      </button>
                    </form>
                    <a href="/suscripcion" className="btn btn-outline btn-lg" style={{ display: 'flex', alignItems: 'center' }}>
                      Conviértete en asociado
                    </a>
                  </>
                )}
              </div>
            )}

            {/* SYLLABUS DEL CURSO */}
            <div className="syllabus">
              {course.sections.map((section, i) => (
                <details key={section.id} className="syllabus-section" open={i === 0}>
                  <summary>
                    <span>Sección {i + 1}: {section.title}</span>
                    <span className="syllabus-meta">
                      {section.lessons.filter((l) => doneIds.has(l.id)).length} / {section.lessons.length}
                    </span>
                  </summary>
                  {section.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      courseSlug={course.slug}
                      done={doneIds.has(lesson.id)}
                      enrolled={enrolled}
                    />
                  ))}
                </details>
              ))}
              
              {/* Lecciones sin sección */}
              {course.lessons.length > 0 && (
                <details className="syllabus-section" open={course.sections.length === 0}>
                  <summary>
                    <span>Contenido General</span>
                    <span className="syllabus-meta">
                      {course.lessons.filter((l) => doneIds.has(l.id)).length} / {course.lessons.length}
                    </span>
                  </summary>
                  {course.lessons.map((lesson) => (
                    <LessonRow
                      key={lesson.id}
                      lesson={lesson}
                      courseSlug={course.slug}
                      done={doneIds.has(lesson.id)}
                      enrolled={enrolled}
                    />
                  ))}
                </details>
              )}
            </div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}