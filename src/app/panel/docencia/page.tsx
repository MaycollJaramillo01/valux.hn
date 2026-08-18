import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { deleteManagedCourse } from '@/lib/courses';
import ConfirmDeleteForm from '@/components/ConfirmDeleteForm';

export const metadata = { title: 'Panel docente - VALUX' };
export const dynamic = 'force-dynamic';

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/panel');
  const role = (session.user as { role?: string }).role;
  if (role !== 'TEACHER' && role !== 'ADMIN') redirect('/panel');

  const courses = await prisma.course.findMany({
    // Los ADMIN ven todos los cursos; los profesores solo los suyos.
    where: role === 'ADMIN' ? {} : { teacherId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { enrollments: true, lessons: true } },
    },
  });

  async function deleteCourse(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) return;
    const role = (session.user as { role?: string }).role;
    const courseId = String(formData.get('courseId') || '');
    if (!courseId) return;
    await deleteManagedCourse({ courseId, userId: session.user.id, role });
  }

  return (
    <div>
        <section className="course-shell">
          <div className="container-narrow">
            <p className="course-eyebrow">VX / <span data-es="Panel docente" data-en="Teacher panel">Panel docente</span></p>
            <h1 className="course-title" data-es="Mis cursos" data-en="My courses">Mis cursos</h1>
            <p className="course-lead" data-es="Gestioná alumnos, progreso y calificaciones." data-en="Manage students, progress and grades.">
              Gestioná alumnos, progreso y calificaciones.
            </p>

            {courses.length === 0 ? (
              <p data-es="No tenés cursos asignados todavía." data-en="No courses assigned to you yet.">
                No tenés cursos asignados todavía.
              </p>
            ) : (
              <table className="panel-table">
                <thead>
                  <tr>
                    <th data-es="Curso" data-en="Course">Curso</th>
                    <th data-es="Profesor" data-en="Teacher">Profesor</th>
                    <th data-es="Lecciones" data-en="Lessons">Lecciones</th>
                    <th data-es="Alumnos" data-en="Students">Alumnos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.title}</strong></td>
                      <td>{c.teacher?.name ?? '—'}</td>
                      <td>{c._count.lessons}</td>
                      <td>{c._count.enrollments}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <a href={`/panel/${c.slug}`} className="btn btn-primary btn-table">
                            <span data-es="Gestionar" data-en="Manage">Gestionar</span>
                          </a>
                          <ConfirmDeleteForm
                            action={deleteCourse}
                            message={`¿Eliminar el curso «${c.title}»? Se borra del catálogo, con lecciones e inscripciones. Los cobros ya hechos se conservan.`}
                            style={{ margin: 0 }}
                          >
                            <input type="hidden" name="courseId" value={c.id} />
                            <button type="submit" className="btn btn-ghost btn-table" style={{ color: 'var(--terracotta)', borderColor: 'var(--terracotta)' }}>
                              <span data-es="Eliminar" data-en="Delete">Eliminar</span>
                            </button>
                          </ConfirmDeleteForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
    </div>
  );
}
