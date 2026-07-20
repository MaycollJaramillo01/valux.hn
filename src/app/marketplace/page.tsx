import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Marketplace - VALUX' };
export const dynamic = 'force-dynamic';

const coverVariants = ['cover-v-royal', 'cover-v-ink', 'cover-v-clay', 'cover-v-paper'];

export default async function MarketplacePage() {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { name: true } },
    },
  });

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container">
            {/* Cabecera de la sección */}
            <div className="section-head center">
              <span className="eyebrow" data-es="Recursos" data-en="Resources">Recursos</span>
              <h2 data-es="Marketplace de Creadores" data-en="Creators Marketplace">Marketplace de Creadores</h2>
              <p className="lead" data-es="Plantillas, presets, guiones y herramientas digitales creadas por la comunidad." data-en="Templates, presets, scripts and digital tools created by the community.">
                Plantillas, presets, guiones y herramientas digitales creadas por la comunidad.
              </p>
            </div>

            {/* Cuadrícula de productos */}
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h3>Catálogo en construcción</h3>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Pronto los creadores de VALUX publicarán sus primeros recursos aquí.</p>
              </div>
            ) : (
              <div className="course-grid"> {/* Reutilizamos la clase de CSS de cursos para mantener consistencia */}
                {products.map((product, i) => (
                  <a key={product.id} href={`/marketplace/${product.id}`} className="course-card">
                    {product.coverUrl ? (
                      <div className="course-card-cover has-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.coverUrl} alt={product.title} />
                      </div>
                    ) : (
                      <div className={`course-card-cover ${coverVariants[i % coverVariants.length]}`}>
                        <span className="cover-index">PROD / {String(i + 1).padStart(2, '0')}</span>
                        <span className="cover-word">{product.title}</span>
                      </div>
                    )}
                    
                    <div className="course-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, paddingRight: '1rem', fontSize: '1.25rem' }}>{product.title}</h3>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.25rem 0.5rem', backgroundColor: '#e2e8f0', color: '#0f172a', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          ${product.price} USD
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description}
                      </p>
                      
                      <div className="course-card-meta" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                          <span aria-hidden="true">👤</span> {product.creator?.name || 'Creador Independiente'}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
            
            {/* CTA para incentivar a la gente a vender */}
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <p style={{ color: '#475569', marginBottom: '1rem' }}>¿Tienes herramientas digitales que le puedan servir a otros?</p>
              <a href="/panel/productos/nuevo" className="btn btn-outline">
                Publicar mi producto
              </a>
            </div>

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}