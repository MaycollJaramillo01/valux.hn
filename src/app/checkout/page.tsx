import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSettings, hasFullCatalogAccess } from '@/lib/access';
import { paypalConfigured } from '@/lib/paypal';
import PayPalCheckout from '@/components/PayPalCheckout';
import AssociateCheckout from '@/components/AssociateCheckout';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; id?: string }>;
}) {
  const { kind, id } = await searchParams;
  const session = await auth();
  if (!session?.user) {
    const q = new URLSearchParams({ kind: kind ?? '', id: id ?? '' }).toString();
    redirect(`/login?callbackUrl=/checkout?${q}`);
  }

  const settings = await getSettings();
  const fullAccess = await hasFullCatalogAccess(session.user.id, (session.user as { role?: string }).role);
  const clientId = process.env.PAYPAL_CLIENT_ID ?? '';

  if (kind === 'SUBSCRIPTION') {
    if (fullAccess) redirect('/catalogo');
    return (
      <>
        <SiteHeader />
        <main id="main">
          <section className="bg-soft">
            <div className="container" style={{ maxWidth: 640, padding: '4rem 1.5rem' }}>
              <p className="eyebrow">Asociación VALUX</p>
              <h1 style={{ textTransform: 'none' }}>Conviértete en asociado</h1>
              <p className="lead">
                Desbloqueás todo el catálogo y podés publicar en el blog y el marketplace (la junta revisa). ${settings.subscriptionPrice.toFixed(2)} USD al mes, con compromiso de 3, 6 o 12 meses.
              </p>
              {paypalConfigured() && clientId ? (
                <AssociateCheckout monthly={settings.subscriptionPrice} clientId={clientId} />
              ) : (
                <p style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                  El cobro con PayPal todavía no está activo. VALUX lo habilita en cuanto la pasarela esté conectada.
                </p>
              )}
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (kind === 'COURSE' && id) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) redirect('/catalogo');
    if (course.price <= 0) {
      redirect(`/cursos/${course.slug}`);
    }
    return (
      <CheckoutShell
        title={course.title}
        description={course.description}
        amount={course.price}
        kind="COURSE"
        itemId={course.id}
        clientId={clientId}
      />
    );
  }

  if (kind === 'PRODUCT' && id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) redirect('/catalogo');
    if (product.price <= 0) {
      redirect(`/marketplace/${product.id}`);
    }
    return (
      <CheckoutShell
        title={product.title}
        description={product.description}
        amount={product.price}
        kind="PRODUCT"
        itemId={product.id}
        clientId={clientId}
      />
    );
  }

  redirect('/catalogo');
}

function CheckoutShell({
  title,
  description,
  amount,
  kind,
  itemId,
  clientId,
}: {
  title: string;
  description: string;
  amount: number;
  kind: 'COURSE' | 'PRODUCT' | 'SUBSCRIPTION';
  itemId?: string;
  clientId: string;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container" style={{ maxWidth: 640, padding: '4rem 1.5rem' }}>
            <p className="eyebrow">Checkout</p>
            <h1 style={{ textTransform: 'none' }}>{title}</h1>
            <p className="lead">{description}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '1.5rem 0' }}>${amount.toFixed(2)} USD</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              El acceso se libera cuando PayPal confirma el pago.
            </p>
            {paypalConfigured() && clientId ? (
              <div style={{ marginTop: '1.5rem' }}>
                <PayPalCheckout kind={kind} itemId={itemId} clientId={clientId} />
              </div>
            ) : (
              <p style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                El cobro con PayPal todavía no está activo. VALUX lo habilita en cuanto la pasarela esté conectada.
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
