import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { payoutDueLabel } from '@/lib/commission';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const metadata = { title: 'Liquidaciones - Junta VALUX' };

export default async function LiquidacionesPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const payouts = await prisma.monthlyPayout.findMany({
    orderBy: [{ periodYm: 'desc' }, { amountDue: 'desc' }],
    include: { seller: { select: { name: true, email: true, paypalEmail: true } } },
  });
  const subscriptions = await prisma.sale.aggregate({
    where: { kind: 'SUBSCRIPTION' },
    _sum: { amountPaid: true },
  });

  async function markTransferred(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const id = String(formData.get('id'));
    await prisma.monthlyPayout.update({
      where: { id },
      data: { status: 'TRANSFERRED', transferredAt: new Date() },
    });
    revalidatePath('/panel/junta/liquidaciones');
  }

  return (
    <div>
      <h1>Liquidaciones</h1>
      <p style={{ color: '#475569' }}>A acreditar a cada vendedor. Plazo: día 10.</p>
      <p style={{ margin: '1rem 0 2rem' }}>
        Recaudado en suscripciones (100% VALUX hasta asignar):{' '}
        <strong>${(subscriptions._sum.amountPaid ?? 0).toFixed(2)} USD</strong>
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Periodo</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Vendedor</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>A transferir</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Plazo</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((row) => (
              <tr key={row.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{row.periodYm}</td>
                <td style={{ padding: '0.75rem' }}>
                  {row.seller.name}<br />
                  <small>{row.seller.email}{row.seller.paypalEmail ? ` · ${row.seller.paypalEmail}` : ''}</small>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${row.amountDue.toFixed(2)}</td>
                <td style={{ padding: '0.75rem' }}>{payoutDueLabel(row.periodYm)}</td>
                <td style={{ padding: '0.75rem' }}>
                  {row.status === 'TRANSFERRED' ? (
                    'Transferido'
                  ) : (
                    <form action={markTransferred}>
                      <input type="hidden" name="id" value={row.id} />
                      <button className="btn btn-primary btn-sm">Marcar transferido</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
