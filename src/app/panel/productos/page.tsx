import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Mis Productos - VALUX' };

export default async function ProductsListPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Buscamos los productos del creador actual ordenados por el más reciente
  const products = await prisma.product.findMany({
    where: { creatorId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Marketplace
          </p>
          <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Mis Productos
          </h1>
          <p style={{ color: '#475569', fontSize: '1.125rem' }}>
            Gestiona los recursos digitales que has subido a la comunidad.
          </p>
        </div>
        <a href="/panel/productos/nuevo" className="btn btn-primary">
          + Nuevo Recurso
        </a>
      </header>

      {products.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '3rem', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '1rem' }}>
            No has subido ningún recurso todavía.
          </p>
          <a href="/panel/productos/nuevo" className="btn btn-outline">
            Publicar mi primer producto
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {products.map((product) => (
            <div key={product.id} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                    {product.title}
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px',
                    backgroundColor: product.published ? '#dcfce7' : '#fef08a',
                    color: product.published ? '#166534' : '#854d0e'
                  }}>
                    {product.published ? 'Publicado' : 'En revisión'}
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </p>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                  {product.price === 0 ? 'Gratis' : `$${product.price}`}
                </span>
                <a href={product.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', textDecoration: 'underline' }}>
                  Ver archivo original
                </a>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}