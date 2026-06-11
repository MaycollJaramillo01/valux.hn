import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

async function requireTeacher(slug: string) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/panel/${slug}`);
  const role = (session.user as { role?: string }).role;
  if (role !== 'TEACHER' && role !== 'ADMIN') redirect('/cursos');

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      sections: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } },
      lessons: { where: { sectionId: null }, orderBy: { order: 'asc' } },
      enrollments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!course) notFound();
  if (role !== 'ADMIN' && course.teacherId !== session.user.id) redirect('/panel');
  return course;
}

export default async function PanelCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await requireTeacher(slug);

  const allLessons = [...course.sections.flatMap((s) => s.lessons), ...course.lessons];
  const studentIds = course.enrollments.map((e) => e.user.id);

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: studentIds }, lessonId: { in: allLessons.map((l) => l.id) } },
  });

  async function saveLessonScore(formData: FormData) {
    'use server';
    await requireTeacher(slug);
    const userId = String(formData.get('userId'));
    const lessonId = String(formData.get('lessonId'));
    const raw = String(formData.get('score') ?? '').trim();
    const score = raw === '' ? null : Math.max(0, Math.min(100, Number(raw)));
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { score, gradedAt: score == null ? null : new Date() },
      create: { userId, lessonId, score, gradedAt: score == null ? null : new Date() },
    });
    revalidatePath(`/panel/${slug}`);
  }

  async function saveFinalGrade(formData: FormData) {
    'use server';
    await requireTeacher(slug);
    const enrollmentId = String(formData.get('enrollmentId'));
    const raw = String(formData.get('finalGrade') ?? '').trim();
    const finalGrade = raw === '' ? null : Math.max(0, Math.min(100, Number(raw)));
    const notes = String(formData.get('notes') ?? '').trim() || null;
    await prisma.enrollment.update({ where: { id: enrollmentId }, data: { finalGrade, notes } });
    revalidatePath(`/panel/${slug}`);
  }

  async function removeStudent(formData: FormData) {
    'use server';
    await requireTeacher(slug);
    const enrollmentId = String(formData.get('enrollmentId'));
    await prisma.enrollment.delete({ where: { id: enrollmentId } });
    revalidatePath(`/panel/${slug}`);
  }

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="course-shell">
          <div className="container-narrow">
            <p className="course-eyebrow">
              <a href="/panel">← <span data-es="Panel docente" data-en="Teacher panel">Panel docente</span></a>
            </p>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-lead">
              {course.enrollments.length}{' '}
              <span data-es="alumnos inscritos" data-en="enrolled students">alumnos inscritos</span>
              {' · '}{allLessons.length}{' '}
              <span data-es="lecciones" data-en="lessons">lecciones</span>
            </p>

            {course.enrollments.length === 0 ? (
              <p data-es="Aún no hay alumnos inscritos." data-en="No students enrolled yet.">Aún no hay alumnos inscritos.</p>
            ) : (
              course.enrollments.map((enr) => {
                const mine = progress.filter((p) => p.userId === enr.user.id);
                const doneIds = new Set(mine.map((p) => p.lessonId));
                const pct = allLessons.length
                  ? Math.round((allLessons.filter((l) => doneIds.has(l.id)).length / allLessons.length) * 100)
                  : 0;
                return (
                  <div key={enr.id} className="panel-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem' }}>{enr.user.name}</strong>{' '}
                        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{enr.user.email}</span>
                      </div>
                      <span className="progress-label">
                        <span data-es="Progreso:" data-en="Progress:">Progreso:</span> {pct}%
                        {enr.finalGrade != null && (
                          <>
                            {' · '}
                            <span className={`grade-chip ${enr.finalGrade >= 60 ? 'is-pass' : 'is-fail'}`}>
                              {enr.finalGrade}/100
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="progress-bar"><span style={{ width: `${pct}%` }} /></div>

                    <table className="panel-table" style={{ marginTop: '1rem' }}>
                      <thead>
                        <tr>
                          <th data-es="Lección" data-en="Lesson">Lección</th>
                          <th data-es="Estado" data-en="Status">Estado</th>
                          <th data-es="Nota" data-en="Score">Nota</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {allLessons.map((l) => {
                          const p = mine.find((x) => x.lessonId === l.id);
                          return (
                            <tr key={l.id}>
                              <td>{l.title}</td>
                              <td>
                                {p ? (
                                  <span className="grade-chip is-pass" data-es="Completada" data-en="Completed">Completada</span>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }} data-es="Pendiente" data-en="Pending">Pendiente</span>
                                )}
                              </td>
                              <td colSpan={2}>
                                <form action={saveLessonScore} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                                  <input type="hidden" name="userId" value={enr.user.id} />
                                  <input type="hidden" name="lessonId" value={l.id} />
                                  <input type="number" name="score" min={0} max={100} defaultValue={p?.score ?? ''} placeholder="—" />
                                  <button type="submit" className="btn btn-ghost btn-table">
                                    <span data-es="Guardar" data-en="Save">Guardar</span>
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <form action={saveFinalGrade} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                      <input type="hidden" name="enrollmentId" value={enr.id} />
                      <label className="progress-label" htmlFor={`fg-${enr.id}`} data-es="Nota final" data-en="Final grade">Nota final</label>
                      <input id={`fg-${enr.id}`} type="number" name="finalGrade" min={0} max={100} defaultValue={enr.finalGrade ?? ''} placeholder="—"
                        style={{ width: 80, minHeight: 38, padding: '.3rem .5rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--line)' }} />
                      <input type="text" name="notes" defaultValue={enr.notes ?? ''} placeholder="Observaciones…"
                        style={{ flex: 1, minWidth: 180, minHeight: 38, padding: '.3rem .6rem', border: '1px solid var(--line)' }} />
                      <button type="submit" className="btn btn-primary btn-table">
                        <span data-es="Guardar nota final" data-en="Save final grade">Guardar nota final</span>
                      </button>
                    </form>

                    <form action={removeStudent} style={{ marginTop: '.8rem' }}>
                      <input type="hidden" name="enrollmentId" value={enr.id} />
                      <button type="submit" className="btn btn-ghost btn-table" style={{ color: 'var(--terracotta)', borderColor: 'var(--terracotta)' }}>
                        <span data-es="Quitar del curso" data-en="Remove from course">Quitar del curso</span>
                      </button>
                    </form>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
