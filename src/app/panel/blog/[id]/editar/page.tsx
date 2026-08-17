import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canWriteBlog, canPublishDirect, isJunta } from '@/lib/access';
import { notifyBlogSubscribers } from '@/lib/notifyBlog';
import { saveUploadedImage } from '@/lib/upload';
import ConfirmPublishButton from '@/components/ConfirmPublishButton';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Editar blog - VALUX' };

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !canWriteBlog(role)) redirect('/panel');

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  if (!isJunta(role) && post.authorId !== session.user.id) redirect('/panel/blog');

  const alreadyNotified = Boolean(post.notifySentAt);
  const junta = canPublishDirect(role);

  async function savePost(formData: FormData) {
    'use server';
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || !canWriteBlog(role)) return;
    const current = await prisma.blogPost.findUnique({ where: { id } });
    if (!current) return;
    if (!isJunta(role) && current.authorId !== session.user.id) return;

    const title = String(formData.get('title') || '').trim();
    const excerpt = String(formData.get('excerpt') || '').trim();
    const body = String(formData.get('body') || '').trim();
    const intent = String(formData.get('intent') || 'draft');
    if (!title || !excerpt || !body) return;

    let coverUrl = current.coverUrl;
    try {
      const uploaded = await saveUploadedImage(formData.get('cover') as File | null, 'blog');
      if (uploaded) coverUrl = uploaded;
    } catch {
      return;
    }

    const publishNow = canPublishDirect(role) && intent === 'publish';
    const keepPublished = current.status === 'PUBLISHED' && intent !== 'draft';
    const nextStatus = canPublishDirect(role)
      ? publishNow || keepPublished
        ? 'PUBLISHED'
        : 'DRAFT'
      : 'PENDING';

    const updated = await prisma.blogPost.update({
      where: { id: current.id },
      data: {
        title,
        excerpt,
        body,
        coverUrl,
        status: nextStatus,
        publishedAt: nextStatus === 'PUBLISHED' ? current.publishedAt ?? new Date() : current.publishedAt,
        rejectionReason: nextStatus === 'PENDING' ? null : current.rejectionReason,
      },
    });

    if (nextStatus === 'PUBLISHED') await notifyBlogSubscribers(updated);
    revalidatePath('/panel/blog');
    revalidatePath('/blog');
    revalidatePath(`/blog/${updated.slug}`);
    redirect('/panel/blog');
  }

  return (
    <div>
      <h1>Editar</h1>
      <p style={{ color: '#475569' }}>
        {alreadyNotified ? 'Esta nota ya avisó por correo; un cambio no reenvía.' : junta ? 'Al publicar se avisa a novedades.' : 'Vuelve a revisión.'}
      </p>

      <form
        action={savePost}
        style={{ display: 'grid', gap: '1rem', background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}
      >
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Título
          <input name="title" required defaultValue={post.title} style={{ padding: '0.75rem', fontWeight: 400 }} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Resumen corto
          <input name="excerpt" required defaultValue={post.excerpt} style={{ padding: '0.75rem', fontWeight: 400 }} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Imagen de portada
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt="" style={{ maxWidth: 280, margin: '0.5rem 0' }} />
          ) : null}
          <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ padding: '0.5rem', fontWeight: 400 }} />
          <span style={{ fontWeight: 400, color: '#64748b' }}>Otro archivo reemplaza la actual.</span>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 700 }}>
          Texto de la publicación
          <textarea name="body" required rows={10} defaultValue={post.body} style={{ padding: '0.75rem', fontWeight: 400, fontFamily: 'inherit' }} />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {junta ? (
            <>
              <button type="submit" name="intent" value="draft" className="btn btn-ghost">
                Guardar borrador
              </button>
              <ConfirmPublishButton
                label={post.status === 'PUBLISHED' ? 'Guardar publicado' : 'Publicar'}
                message={
                  alreadyNotified ? '¿Guardar en el blog? No se reenvía correo.' : '¿Publicar y avisar a novedades?'
                }
              />
            </>
          ) : (
            <button type="submit" name="intent" value="review" className="btn btn-primary">
              Enviar a revisión
            </button>
          )}
          <a href="/panel/blog" className="btn btn-ghost">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
