import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { canPublishDirect, canSellProducts, associateSeatActive, isJunta } from '@/lib/access';
import { getSettings } from '@/lib/access';
import PriceSplitField from '@/components/PriceSplitField';

export const metadata = { title: 'Publicar Producto - VALUX' };

export default async function NewProductPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user) redirect('/login');
  if (!canSellProducts(role) || !(isJunta(role) || (await associateSeatActive(session.user.id, role)))) redirect('/panel');
  const settings = await getSettings();
  const direct = canPublishDirect(role);

  async function createProduct(formData: FormData) {
    'use server';
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user?.id || !canSellProducts(role)) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = Number(formData.get('price'));
    const downloadUrl = formData.get('downloadUrl') as string;
    const publishNow = canPublishDirect(role);

    await prisma.product.create({
      data: {
        title,
        description,
        price,
        downloadUrl,
        published: publishNow,
        reviewStatus: publishNow ? 'PUBLISHED' : 'PENDING',
        creatorId: session.user.id,
      },
    });

    redirect('/panel/productos');
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Marketplace
        </p>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Nuevo Recurso
        </h1>
        <p style={{ color: '#475569', fontSize: '1.125rem' }}>
          {direct ? 'Se publica ya.' : 'Entra a revisión.'}
        </p>
      </header>

      <form action={createProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', padding: '2rem', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="title" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Título del producto
          </label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            placeholder="Ej. Paquete de Presets Lightroom - Estilo HN"
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="description" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Descripción completa
          </label>
          <textarea 
            id="description" 
            name="description" 
            rows={5} 
            placeholder="Explica qué incluye, para quién es y qué problema resuelve..."
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit' }}
            required
          ></textarea>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="downloadUrl" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Enlace de descarga (Drive, Dropbox, etc.)
          </label>
          <input 
            type="url" 
            id="downloadUrl" 
            name="downloadUrl" 
            placeholder="https://drive.google.com/..."
            style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
            required
          />
        </div>

        <PriceSplitField commissionPercent={settings.commissionPercent} />

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            {direct ? 'Publicar' : 'Enviar a revisión'}
          </button>
          <a href="/panel" className="btn btn-ghost">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}