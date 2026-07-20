import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Cursos - VALUX' };
export const dynamic = 'force-dynamic';

const coverVariants = ['cover-v-royal', 'cover-v-ink', 'cover-v-clay', 'cover-v-paper'];

export default async function CoursesPage() {
  const session = await auth();
  
  // 1. LÓGICA DE NEGOCIO: Evaluamos el rol del usuario actual
  const userRole = (session?.user as { role?: string })?.role ?? 'PUBLIC';
  const isMember = ['MEMBER', 'TEACHER', 'ADMIN'].includes(userRole);

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
              <p className="lead" data-es="Clases creadas por y para creadores hondureños." data-en="Classes created by and for Honduran creators.">
                Clases creadas por y para creadores hondureños.
              </p>
            </div>

            {courses.length === 0 ? (
              <p style={{ textAlign: 'center' }}>Pronto publicaremos los primeros cursos.</p>
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
                      {/* 2. ETIQUETA VISUAL: Mostramos el badge según el rol */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, paddingRight: '1rem' }}>{course.title}</h3>
                        {isMember ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', backgroundColor: 'var(--ink, #111)', color: 'var(--paper, #fff)', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            Acceso Miembro
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                            {course.price && course.price > 0 ? `$${course.price} USD` : 'Gratis'}
                          </span>
                        )}
                      </div>
                      
                      <p>{course.description}</p>
                      
                      <div className="course-card-meta">
                        <span>
                          {course._count.lessons} <span data-es="lecciones" data-en="lessons">lecciones</span>
                        </span>
                        <span>{course.teacher?.name ?? 'VALUX'}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* 3. CTA DINÁMICO: Invitamos a los usuarios a mejorar su cuenta si no son miembros */}
            {!session?.user ? (
              <p style={{ textAlign: 'center', marginTop: '2.4rem' }}>
                <a href="/registro" className="btn btn-primary">
                  <span>Crear cuenta para inscribirme</span>
                  <span className="arrow">→</span>
                </a>
              </p>
            ) : !isMember ? (
              <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '1rem' }}>Desbloquea todos los cursos</h3>
                <p style={{ marginBottom: '1.5rem', color: '#475569' }}>Los miembros de VALUX tienen acceso gratuito a toda la academia.</p>
                <a href="/membresia" className="btn btn-primary">Convertirme en Miembro</a>
              </div>
            ) : null}

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}