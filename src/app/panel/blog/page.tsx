import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canWriteBlog, canPublishDirect, isJunta } from '@/lib/access';
import { notifyBlogSubscribers } from '@/lib/notifyBlog';
import { slugify } from '@/lib/commission';
import { saveUploadedImage } from '@/lib/upload';
import ConfirmPublishButton from '@/components/ConfirmPublishButton';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Blog - Panel VALUX' };

function statusLabel(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'Publicado';
    case 'PENDING':
      return 'En revisión';
    case 'REJECTED':
      return 'Rechazado';
    default:
      return 'Borrador';
  }
}

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
    const intent = String(formData.get('intent') || 'draft');
    if (!title || !excerpt || !body) return;

    let coverUrl: string | null = null;
    try {
      coverUrl = await saveUploadedImage(formData.get('cover') as File | null, 'blog');
    } catch {
      return;
    }

    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    const junta = canPublishDirect(role);
    const publishNow = junta && intent === 'publish';
    const post = await prisma.blogPost.create({
      data: {
        authorId: session.user.id,
        title,
        excerpt,
        body,
        coverUrl,
        slug,
        status: publishNow ? 'PUBLISHED' : junta ? 'DRAFT' : 'PENDING',
        publishedAt: publishNow ? new Date() : null,
      },
    });
    if (publishNow) await notifyBlogSubscribers(post);
    revalidatePath('/panel/blog');
    revalidatePath('/blog');
    redirect('/panel/blog');
  }

  return (
    <div>
      <h1>Blog</h1>
      <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
        {isJunta(role) ? 'Borrador o publicar. Al publicar se avisa a novedades, una sola vez.' : 'Va a revisión; no se publica solo.'}
      </p>

      <form
        action={createPost}
        style={{ display: 'grid', gap: '1rem', background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '2rem' }}
      >
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Título
          <input name="title" required style={{ padding: '0.75rem', fontWeight: 400 }} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Resumen corto
          <input name="excerpt" required style={{ padding: '0.75rem', fontWeight: 400 }} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Imagen de portada
          <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ padding: '0.5rem', fontWeight: 400 }} />
          <span style={{ fontWeight: 400, color: '#64748b' }}>JPG, PNG, WebP o GIF. Hasta 4 MB.</span>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Texto de la publicación
          <textarea name="body" required rows={8} style={{ padding: '0.75rem', fontWeight: 400, fontFamily: 'inherit' }} />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isJunta(role) ? (
            <>
              <button type="submit" name="intent" value="draft" className="btn btn-ghost">
                Guardar borrador
              </button>
              <ConfirmPublishButton />
            </>
          ) : (
            <button type="submit" name="intent" value="review" className="btn btn-primary">
              Enviar a revisión
            </button>
          )}
        </div>
      </form>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {posts.map((post) => (
          <article key={post.id} style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0' }}>
            <strong>{post.title}</strong>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              {statusLabel(post.status)} · {post.author.name}
              {post.notifySentAt ? ' · correo enviado' : ''}
              {post.rejectionReason ? ` · Motivo: ${post.rejectionReason}` : ''}
            </p>
            <p style={{ margin: '0.75rem 0 0' }}>
              <a href={`/panel/blog/${post.id}/editar`} className="btn btn-ghost btn-sm">
                Editar
              </a>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
