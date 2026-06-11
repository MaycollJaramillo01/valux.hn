import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Cursos - VALUX' };
export const dynamic = 'force-dynamic';

// Variantes de carátula editorial cuando el curso no tiene imagen propia.
const coverVariants = ['cover-v-royal', 'cover-v-ink', 'cover-v-clay', 'cover-v-paper'];

export default async function CoursesPage() {
  const session = await auth();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
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
              <div className="course-grid">
                {courses.map((course, i) => (
                  <a key={course.id} href={`/cursos/${course.slug}`} className="course-card">
                    {course.coverUrl ? (
                      <div className="course-card-cover has-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={course.coverUrl} alt={course.title} />
                      </div>
                    ) : (
                      <div className={`course-card-cover ${coverVariants[i % coverVariants.length]}`}>
                        <span className="cover-index">VX / {String(i + 1).padStart(2, '0')}</span>
                        <span className="cover-word">{course.title}</span>
                      </div>
                    )}
                    <div className="course-card-body">
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <div className="course-card-meta">
                        <span>
                          {course._count.lessons}{' '}
                          <span data-es="lecciones" data-en="lessons">lecciones</span>
                        </span>
                        <span>{course.teacher?.name ?? 'VALUX'}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {!session?.user && (
              <p style={{ textAlign: 'center', marginTop: '2.4rem' }}>
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
