import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Cursos - VALUX' };
export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const session = await auth();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { lessons: true } } },
  });

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container">
            <div className="section-head center">
              <span className="eyebrow" data-es="Formación" data-en="Learning">Formación</span>
              <h2 data-es="Cursos de la comunidad" data-en="Community courses">Cursos de la comunidad</h2>
              <p
                className="lead"
                data-es="Clases creadas por y para creadores hondureños."
                data-en="Classes created by and for Honduran creators."
              >
                Clases creadas por y para creadores hondureños.
              </p>
            </div>

            {courses.length === 0 ? (
              <p style={{ textAlign: 'center' }} data-es="Pronto publicaremos los primeros cursos." data-en="We will publish the first courses soon.">
                Pronto publicaremos los primeros cursos.
              </p>
            ) : (
              <div className="contact-grid">
                {courses.map((course) => (
                  <div key={course.id} className="contact-tile">
                    <h4>{course.title}</h4>
                    <p style={{ marginBottom: '.4rem', color: 'var(--grey-700)' }}>{course.description}</p>
                    <p style={{ marginBottom: '.4rem', fontSize: '.85rem', color: 'var(--grey-700)' }}>
                      {course._count.lessons}{' '}
                      <span data-es="lecciones" data-en="lessons">lecciones</span>
                    </p>
                    <a href={`/cursos/${course.slug}`} data-es="Ver curso" data-en="View course">Ver curso</a>
                  </div>
                ))}
              </div>
            )}

            {!session?.user && (
              <p style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a href="/registro" className="btn btn-primary">
                  <span data-es="Crear cuenta para inscribirme" data-en="Create an account to enroll">
                    Crear cuenta para inscribirme
                  </span>
                  <span className="arrow">→</span>
                </a>
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
