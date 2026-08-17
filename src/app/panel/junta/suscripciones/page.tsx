import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSettings, isJunta } from '@/lib/access';
import { splitPrice } from '@/lib/commission';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Suscripción - Junta VALUX' };

export default async function SuscripcionesPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const settings = await getSettings();
  const example = splitPrice(100, settings.commissionPercent);
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });

  async function savePrice(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;

    const subscriptionPrice = Number(formData.get('subscriptionPrice'));
    const commissionPercent = Number(formData.get('commissionPercent'));
    if (!Number.isFinite(subscriptionPrice) || subscriptionPrice < 0) return;
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) return;

    await prisma.platformSettings.upsert({
      where: { id: 'valux' },
      update: { subscriptionPrice, commissionPercent },
      create: { id: 'valux', subscriptionPrice, commissionPercent },
    });
    revalidatePath('/panel/junta/suscripciones');
    revalidatePath('/suscripcion');
    revalidatePath('/checkout');
    revalidatePath('/catalogo');
  }

  return (
    <div>
      <h1>Suscripción</h1>
      <p style={{ color: '#475569' }}>Precio de ahora en adelante. Lo ya cobrado no cambia.</p>

      <form
        action={savePrice}
        style={{
          marginTop: '2rem',
          maxWidth: 560,
          background: '#fff',
          padding: '2rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Precio global</h2>
        <div>
          <label htmlFor="subscriptionPrice" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            Suscripción global (USD)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>$</span>
            <input
              id="subscriptionPrice"
              name="subscriptionPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.subscriptionPrice}
              required
              style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit', maxWidth: 160 }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="commissionPercent" style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            Comisión VALUX (%)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="commissionPercent"
              name="commissionPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={settings.commissionPercent}
              required
              style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit', maxWidth: 160 }}
            />
            <span>%</span>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '0.9rem 1rem' }}>
          En $100: VALUX ${example.valuxFee.toFixed(2)} · vendedor ${example.sellerAmount.toFixed(2)}. Acreditación: día 10.
        </p>
        <button type="submit" className="btn btn-primary">
          Guardar precio
        </button>
      </form>

      <section style={{ margin: '3rem 0 2rem' }}>
        <h2>Lista del blog</h2>
        <p style={{ color: '#64748b' }}>{subscribers.filter((s) => !s.unsubscribedAt).length} correos de novedades</p>
        <ul>
          {subscribers.length === 0 ? (
            <li style={{ color: '#64748b' }}>Todavía no hay correos.</li>
          ) : (
            subscribers.map((s) => (
              <li key={s.id}>
                {s.email} · desde {s.createdAt.toLocaleDateString('es-HN')}
                {s.unsubscribedAt ? ' · baja' : ''}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
