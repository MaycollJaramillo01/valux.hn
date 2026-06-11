import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
        {!enrolled && <span data-es="Bloqueada" data-en="Locked">Bloqueada</span>}
      </span>
    </>
  );

  if (!enrolled) {
    return <div className="lesson-row is-locked">{inner}</div>;
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

  async function enroll() {
    'use server';
    const session = await auth();
    if (!session?.user) redirect(`/login?callbackUrl=/cursos/${slug}`);
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: course!.id } },
      update: {},
      create: { userId: session.user.id, courseId: course!.id },
    });
    revalidatePath(`/cursos/${slug}`);
  }

  const enrolled = Boolean(enrollment);

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
              <div>
                <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>
                <p className="progress-label">
                  {doneCount} / {allLessons.length}{' '}
                  <span data-es="lecciones completadas" data-en="lessons completed">lecciones completadas</span>
                  {' · '}{pct}% · {totalPoints} pts{' '}
                  <span data-es="en juego" data-en="available">en juego</span>
                  {enrollment?.finalGrade != null && (
                    <>
                      {' · '}
                      <span data-es="Nota final:" data-en="Final grade:">Nota final:</span>{' '}
                      <strong>{enrollment.finalGrade}/100</strong>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <form action={enroll}>
                <button type="submit" className="btn btn-primary btn-lg">
                  <span data-es="Inscribirme al curso" data-en="Enroll in course">Inscribirme al curso</span>
                  <span className="btn-glyph" aria-hidden="true">→</span>
                </button>
              </form>
            )}

            <div className="syllabus">
              {course.sections.map((section, i) => (
                <details key={section.id} className="syllabus-section" open={i === 0}>
                  <summary>
                    <span>
                      <span data-es="Sección" data-en="Section">Sección</span> {i + 1}: {section.title}
                    </span>
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
              {course.lessons.length > 0 && (
                <details className="syllabus-section" open={course.sections.length === 0}>
                  <summary>
                    <span data-es="Contenido" data-en="Content">Contenido</span>
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
