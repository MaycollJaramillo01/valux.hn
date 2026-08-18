import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessProduct, hasFullCatalogAccess } from '@/lib/access';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true } } },
  });
  if (!product || !product.published) notFound();

  const role = (session?.user as { role?: string })?.role;
  const unlocked = session?.user
    ? await canAccessProduct({
        userId: session.user.id,
        role,
        productId: product.id,
        creatorId: product.creatorId,
      })
    : false;
  const fullAccess = session?.user ? await hasFullCatalogAccess(session.user.id, role) : false;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="course-shell">
          <div className="container-narrow">
            <p className="course-eyebrow">Marketplace · {product.creator.name}</p>
            <h1 className="course-title">{product.title}</h1>
            <p className="course-lead">{product.description}</p>
            {unlocked ? (
              <p style={{ margin: '2rem 0' }}>
                <a href={product.downloadUrl} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
                  Descargar recurso
                </a>
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '2rem 0' }}>
                {session?.user ? (
                  <>
                    <a href={`/checkout?kind=PRODUCT&id=${product.id}`} className="btn btn-primary btn-lg">
                      Comprar por ${product.price} USD
                    </a>
                    {!fullAccess && (
                      <a href="/suscripcion" className="btn btn-outline btn-lg">
                        Conviértete en asociado
                      </a>
                    )}
                  </>
                ) : (
                  <a href={`/login?callbackUrl=/marketplace/${product.id}`} className="btn btn-primary btn-lg">
                    Entrar para comprar
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
