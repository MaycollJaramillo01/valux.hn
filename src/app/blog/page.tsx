import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsletterForm from '@/components/NewsletterForm';

export const metadata = { title: 'Blog - VALUX' };
export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    include: { author: { select: { name: true } } },
  });
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="blog-hero dark-section">
          <div className="container blog-hero-grid">
            <div>
              <span className="eyebrow">Blog</span>
              <h1>Crónica de un movimiento creativo.</h1>
            </div>
            <p className="lead">
              Noticias y artículos de la comunidad VALUX. Suscribite para recibir cada publicación nueva.
            </p>
          </div>
        </section>

        <section className="blog-editorial">
          <div className="container">
            {featured ? (
              <article className="featured-post">
                {featured.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.coverUrl} alt="" />
                ) : (
                  <div className="course-card-cover cover-v-royal" style={{ minHeight: 280 }} />
                )}
                <div className="featured-post-copy">
                  <span className="post-tag">Noticia principal</span>
                  <time>{featured.publishedAt?.toLocaleDateString('es-HN')}</time>
                  <h2>{featured.title}</h2>
                  <p>{featured.excerpt}</p>
                  <p style={{ color: '#64748b' }}>{featured.author.name}</p>
                  <a href={`/blog/${featured.slug}`} className="btn btn-primary">Leer historia</a>
                </div>
              </article>
            ) : (
              <p>Todavía no hay publicaciones. La junta y los asociados publicarán aquí.</p>
            )}

            <div className="post-list">
              {rest.map((post) => (
                <article key={post.id} className="post-row">
                  <div>
                    <time>{post.publishedAt?.toLocaleDateString('es-HN')}</time>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                  </div>
                  <a href={`/blog/${post.slug}`} className="read">Leer →</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="blog-newsletter">
          <div className="container container-narrow">
            <div className="cta-band">
              <h2>Recibí las novedades cada mes.</h2>
              <p>Una sola edición mensual. Sin spam, sin promesas vacías.</p>
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
