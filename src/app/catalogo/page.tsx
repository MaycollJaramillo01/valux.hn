import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasFullCatalogAccess } from '@/lib/access';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Academia - VALUX' };
export const dynamic = 'force-dynamic';

const coverVariants = ['cover-v-royal', 'cover-v-ink', 'cover-v-clay', 'cover-v-paper'];

export default async function CatalogoPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const fullAccess = session?.user ? await hasFullCatalogAccess(session.user.id, role) : false;

  const [courses, products] = await Promise.all([
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { lessons: true } },
      },
    }),
    prisma.product.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container">
            <div className="section-head center">
              <span className="eyebrow">Academia</span>
              <h2>Cursos y recursos</h2>
              <p className="lead">
                Un solo espacio: formación y marketplace. Comprá ítems sueltos o asociate y desbloqueá todo.
              </p>
              {!fullAccess && (
                <p style={{ marginTop: '1.25rem' }}>
                  <a href="/suscripcion" className="btn btn-primary">Conviértete en asociado</a>
                </p>
              )}
            </div>

            <section id="formacion" style={{ marginBottom: '4rem' }}>
              <h3 style={{ marginBottom: '1.25rem' }}>Formación</h3>
              {courses.length === 0 ? (
                <p>Pronto publicaremos los primeros cursos.</p>
              ) : (
                <div className="course-grid">
                  {courses.map((course, i) => (
                    <a key={course.id} href={`/cursos/${course.slug}`} className="course-card">
                      <div className={`course-card-cover ${course.coverUrl ? 'has-image' : coverVariants[i % coverVariants.length]}`}>
                        {course.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.coverUrl} alt={course.title} />
                        ) : (
                          <>
                            <span className="cover-index">VX / {String(i + 1).padStart(2, '0')}</span>
                            <span className="cover-word">{course.title}</span>
                          </>
                        )}
                      </div>
                      <div className="course-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <h3 style={{ margin: 0 }}>{course.title}</h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {fullAccess ? 'Incluido' : course.price > 0 ? `$${course.price} USD` : 'Gratis'}
                          </span>
                        </div>
                        <p>{course.description}</p>
                        <div className="course-card-meta">
                          <span>{course._count.lessons} lecciones</span>
                          <span>{course.teacher?.name ?? 'VALUX'}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section id="recursos">
              <h3 style={{ marginBottom: '1.25rem' }}>Marketplace</h3>
              {products.length === 0 ? (
                <p>Pronto los creadores publicarán recursos aquí.</p>
              ) : (
                <div className="course-grid">
                  {products.map((product, i) => (
                    <a key={product.id} href={`/marketplace/${product.id}`} className="course-card">
                      <div className={`course-card-cover ${product.coverUrl ? 'has-image' : coverVariants[i % coverVariants.length]}`}>
                        {product.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.coverUrl} alt={product.title} />
                        ) : (
                          <>
                            <span className="cover-index">PROD / {String(i + 1).padStart(2, '0')}</span>
                            <span className="cover-word">{product.title}</span>
                          </>
                        )}
                      </div>
                      <div className="course-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <h3 style={{ margin: 0 }}>{product.title}</h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {fullAccess ? 'Incluido' : `$${product.price} USD`}
                          </span>
                        </div>
                        <p>{product.description}</p>
                        <div className="course-card-meta">
                          <span>{product.creator?.name ?? 'VALUX'}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
