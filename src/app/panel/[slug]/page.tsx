import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deleteManagedCourse } from '@/lib/courses';
import ConfirmDeleteForm from '@/components/ConfirmDeleteForm';

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

  async function deleteCourse() {
    'use server';
    const session = await auth();
    if (!session?.user) return;
    const role = (session.user as { role?: string }).role;
    const ok = await deleteManagedCourse({
      courseId: course.id,
      userId: session.user.id,
      role,
    });
    if (ok) redirect('/panel/docencia');
  }

  return (
    <div>
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

            {/* --- INICIO ZONA GESTIÓN DE TEMARIO --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }} data-es="Gestión del temario" data-en="Syllabus management">Gestión del temario</h2>
              <a href={`/panel/${course.slug}/nueva-leccion`} className="btn btn-primary">
                <span data-es="+ Nueva lección" data-en="+ New lesson">+ Nueva lección</span>
              </a>
            </div>

            {allLessons.length === 0 ? (
              <div className="panel-card" style={{ marginBottom: '3rem', textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--muted)' }} data-es="No has subido ninguna lección todavía." data-en="You haven't uploaded any lessons yet.">No has subido ninguna lección todavía.</p>
              </div>
            ) : (
              <div className="panel-card" style={{ marginBottom: '3rem' }}>
                <table className="panel-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th data-es="Lección" data-en="Lesson">Lección</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLessons.map((l, index) => (
                      <tr key={`edit-${l.id}`}>
                        <td style={{ width: '40px', color: 'var(--muted)' }}>{l.order ?? index + 1}</td>
                        <td><strong>{l.title}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <a href={`/panel/${course.slug}/${l.slug}/editar`} className="btn btn-ghost btn-table">
                            <span data-es="Editar / Eliminar" data-en="Edit / Delete">Editar / Eliminar</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* --- FIN ZONA GESTIÓN DE TEMARIO --- */}

            <h2 style={{ fontSize: '1.25rem', marginTop: '3rem', marginBottom: '1rem' }} data-es="Progreso de alumnos" data-en="Student progress">Progreso de alumnos</h2>

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
                  <div key={enr.id} className="panel-card" style={{ marginBottom: '1.5rem' }}>
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

            <div className="panel-card" style={{ marginTop: '3rem', background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#991b1b' }}>Eliminar curso</h2>
              <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Se borra del catálogo, con lecciones e inscripciones. Los cobros ya hechos se conservan.
              </p>
              <ConfirmDeleteForm
                action={deleteCourse}
                message={`¿Eliminar el curso «${course.title}»? Esta acción no se puede deshacer.`}
              >
                <button type="submit" className="btn btn-ghost btn-table" style={{ color: '#fff', background: '#ef4444', borderColor: '#ef4444' }}>
                  Eliminar curso definitivamente
                </button>
              </ConfirmDeleteForm>
            </div>
          </div>
        </section>
    </div>
  );
}