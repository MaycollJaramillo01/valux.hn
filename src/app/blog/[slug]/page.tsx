import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsletterForm from '@/components/NewsletterForm';

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } },
  });
  if (!post) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="blog-hero dark-section">
          <div className="container" style={{ maxWidth: 800 }}>
            <span className="eyebrow">Blog</span>
            <h1>{post.title}</h1>
            <p className="lead">
              {post.author.name}
              {post.publishedAt ? ` · ${post.publishedAt.toLocaleDateString('es-HN')}` : ''}
            </p>
          </div>
        </section>
        <section>
          <div className="container" style={{ maxWidth: 720, padding: '3rem 1.5rem' }}>
            {post.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverUrl} alt="" style={{ width: '100%', marginBottom: '2rem' }} />
            ) : null}
            <article style={{ whiteSpace: 'pre-wrap', fontSize: '1.08rem', lineHeight: 1.7 }}>{post.body}</article>
            <div style={{ marginTop: '3rem' }}>
              <h3>Recibí las novedades de VALUX</h3>
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
