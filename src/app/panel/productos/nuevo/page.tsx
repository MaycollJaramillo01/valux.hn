import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Publicar Producto - VALUX' };

export default async function NewProductPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  async function createProduct(formData: FormData) {
    'use server';
    
    const session = await auth();
    if (!session?.user?.id) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = Number(formData.get('price'));
    const downloadUrl = formData.get('downloadUrl') as string;

    await prisma.product.create({
      data: {
        title,
        description,
        price,
        downloadUrl,
        published: false,
        creatorId: session.user.id
      }
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
          Sube tu infoproducto. Recuerda que todos los recursos pasan por una revisión de calidad antes de ser publicados en la tienda.
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="price" style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
            Precio (USD)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#64748b' }}>$</span>
            <input 
              type="number" 
              id="price" 
              name="price"
              min="0"
              step="0.01"
              placeholder="0.00"
              style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit', maxWidth: '150px' }}
              required
            />
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Deja 0 para recursos gratuitos.</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary">
            Enviar a revisión
          </button>
          <a href="/panel" className="btn btn-ghost">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}