import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canWriteBlog, canPublishDirect, isJunta } from '@/lib/access';
import { notifyBlogSubscribers } from '@/lib/notifyBlog';
import { slugify } from '@/lib/commission';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Blog - Panel VALUX' };

export default async function PanelBlogPage() {
  const session = await auth();
  if (!session?.user || !canWriteBlog((session.user as { role?: string }).role)) {
    redirect('/panel');
  }
  const role = (session.user as { role?: string }).role;
  const posts = await prisma.blogPost.findMany({
    where: isJunta(role) ? {} : { authorId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: { author: { select: { name: true } } },
  });

  async function createPost(formData: FormData) {
    'use server';
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || !canWriteBlog(role)) return;
    const title = String(formData.get('title') || '').trim();
    const excerpt = String(formData.get('excerpt') || '').trim();
    const body = String(formData.get('body') || '').trim();
    const coverUrl = String(formData.get('coverUrl') || '').trim() || null;
    if (!title || !excerpt || !body) return;
    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    const direct = canPublishDirect(role);
    const post = await prisma.blogPost.create({
      data: {
        authorId: session.user.id,
        title,
        excerpt,
        body,
        coverUrl,
        slug,
        status: direct ? 'PUBLISHED' : 'PENDING',
        publishedAt: direct ? new Date() : null,
      },
    });
    if (direct) await notifyBlogSubscribers(post);
    redirect('/panel/blog');
  }

  return (
    <div>
      <h1>Blog</h1>
      <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
        {isJunta(role)
          ? 'La junta publica de inmediato. Los borradores de asociados aparecen en Revisiones.'
          : 'Tu post queda en borrador para que la junta lo apruebe antes de salir al blog público.'}
      </p>

      <form action={createPost} style={{ display: 'grid', gap: '0.75rem', background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <input name="title" required placeholder="Título" style={{ padding: '0.75rem' }} />
        <input name="excerpt" required placeholder="Resumen corto" style={{ padding: '0.75rem' }} />
        <input name="coverUrl" type="url" placeholder="URL de imagen (opcional)" style={{ padding: '0.75rem' }} />
        <textarea name="body" required rows={8} placeholder="Texto de la publicación" style={{ padding: '0.75rem' }} />
        <button type="submit" className="btn btn-primary">
          {isJunta(role) ? 'Publicar ahora' : 'Enviar a revisión'}
        </button>
      </form>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {posts.map((post) => (
          <article key={post.id} style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0' }}>
            <strong>{post.title}</strong>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              {post.status} · {post.author.name}
              {post.rejectionReason ? ` · Motivo: ${post.rejectionReason}` : ''}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
