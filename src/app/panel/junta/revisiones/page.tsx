import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { notifyBlogSubscribers } from '@/lib/notifyBlog';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Revisiones - Junta VALUX' };

export default async function JuntaRevisionesPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const [posts, products] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { updatedAt: 'desc' },
      include: { author: { select: { name: true, email: true } } },
    }),
    prisma.product.findMany({
      where: { reviewStatus: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { updatedAt: 'desc' },
      include: { creator: { select: { name: true, email: true } } },
    }),
  ]);

  async function decidePost(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    const action = String(formData.get('action'));
    const reason = String(formData.get('reason') || '').trim();
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return;
    if (action === 'approve') {
      const updated = await prisma.blogPost.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: post.publishedAt ?? new Date(),
          rejectionReason: null,
        },
      });
      await notifyBlogSubscribers(updated);
    } else {
      await prisma.blogPost.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason || 'Sin motivo indicado' },
      });
    }
    revalidatePath('/panel/junta/revisiones');
  }

  async function decideProduct(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    const action = String(formData.get('action'));
    const reason = String(formData.get('reason') || '').trim();
    if (action === 'approve') {
      await prisma.product.update({
        where: { id },
        data: { reviewStatus: 'PUBLISHED', published: true, rejectionReason: null },
      });
    } else {
      await prisma.product.update({
        where: { id },
        data: { reviewStatus: 'REJECTED', published: false, rejectionReason: reason || 'Sin motivo indicado' },
      });
    }
    revalidatePath('/panel/junta/revisiones');
  }

  return (
    <div>
      <h1>Revisiones</h1>
      <p style={{ color: '#475569', marginBottom: '2rem' }}>Blog y marketplace pendientes. Si rechazás, el motivo se ve.</p>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Blog pendiente</h2>
        {posts.length === 0 ? <p>No hay posts en espera.</p> : posts.map((post) => (
          <article key={post.id} style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
            <h3>{post.title}</h3>
            <p style={{ color: '#64748b' }}>{post.author.name} · {post.author.email}</p>
            <p>{post.excerpt}</p>
            <div style={{ whiteSpace: 'pre-wrap', margin: '1rem 0' }}>{post.body}</div>
            <form action={decidePost} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="hidden" name="id" value={post.id} />
              <button name="action" value="approve" className="btn btn-primary">Aprobar</button>
              <input name="reason" placeholder="Motivo si rechazás" style={{ padding: '0.5rem', flex: 1 }} />
              <button name="action" value="reject" className="btn btn-ghost">Rechazar</button>
            </form>
          </article>
        ))}
      </section>

      <section>
        <h2>Productos pendientes</h2>
        {products.length === 0 ? <p>No hay productos en espera.</p> : products.map((product) => (
          <article key={product.id} style={{ background: '#fff', padding: '1rem', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
            <h3>{product.title} · ${product.price} USD</h3>
            <p style={{ color: '#64748b' }}>{product.creator.name} · {product.creator.email}</p>
            <p>{product.description}</p>
            <form action={decideProduct} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="hidden" name="id" value={product.id} />
              <button name="action" value="approve" className="btn btn-primary">Aprobar</button>
              <input name="reason" placeholder="Motivo si rechazás" style={{ padding: '0.5rem', flex: 1 }} />
              <button name="action" value="reject" className="btn btn-ghost">Rechazar</button>
            </form>
          </article>
        ))}
      </section>
    </div>
  );
}
