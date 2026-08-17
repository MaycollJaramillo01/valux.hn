import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { periodYm } from '@/lib/commission';
import { canSellProducts, canTeachCourses } from '@/lib/access';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Mis ventas' };

export default async function VentasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role;
  if (!canSellProducts(role) && !canTeachCourses(role)) redirect('/panel');

  const current = periodYm();
  const [sales, payouts] = await Promise.all([
    prisma.sale.findMany({
      where: { sellerId: session.user.id },
      orderBy: { paidAt: 'desc' },
      include: { course: { select: { title: true } }, product: { select: { title: true } } },
    }),
    prisma.monthlyPayout.findMany({
      where: { sellerId: session.user.id },
      orderBy: { periodYm: 'desc' },
    }),
  ]);

  const thisMonth = payouts.find((p) => p.periodYm === current);

  return (
    <div>
      <h1>Mis ventas</h1>
      <p style={{ color: '#475569' }}>Tu 70%. Se acredita el día 10 del mes siguiente.</p>
      <p style={{ fontSize: '1.25rem', margin: '1.5rem 0' }}>
        Este mes: <strong>${(thisMonth?.amountDue ?? 0).toFixed(2)} USD</strong>
        {thisMonth ? ` · ${thisMonth.status === 'TRANSFERRED' ? 'acreditado' : 'plazo: día 10'}` : ''}
      </p>
      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Fecha</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Ítem</th>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>Pagó</th>
            <th style={{ textAlign: 'right', padding: '0.75rem' }}>Tu parte</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} style={{ borderTop: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}>{sale.paidAt.toLocaleDateString('es-HN')}</td>
              <td style={{ padding: '0.75rem' }}>{sale.course?.title || sale.product?.title || sale.kind}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${sale.amountPaid.toFixed(2)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${sale.sellerAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
