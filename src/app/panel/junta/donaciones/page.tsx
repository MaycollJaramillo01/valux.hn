import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';

export const metadata = { title: 'Donaciones - Junta VALUX' };
export const dynamic = 'force-dynamic';

export default async function JuntaDonacionesPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !isJunta(role)) redirect('/panel');

  const donations = await prisma.donation.findMany({
    where: { status: 'PAID' },
    orderBy: { paidAt: 'desc' },
  });
  const total = donations.reduce((sum, row) => sum + row.total, 0);

  return (
    <div>
      <h1>Donaciones</h1>
      <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
        Compromisos cobrados por PayPal. {donations.length} pagos · ${total.toFixed(2)} USD.
      </p>
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Quién</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Mensual</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Compromiso</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: '#64748b' }}>
                  Todavía no hay donaciones cobradas.
                </td>
              </tr>
            ) : (
              donations.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {(row.paidAt ?? row.createdAt).toLocaleDateString('es-HN')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {row.payerName || row.payerEmail || 'PayPal'}
                    {row.payerEmail && row.payerName ? (
                      <small style={{ display: 'block', color: '#64748b' }}>{row.payerEmail}</small>
                    ) : null}
                  </td>
                  <td style={{ padding: '0.75rem' }}>${row.monthlyAmount.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>{row.months === 12 ? '1 año' : `${row.months} meses`}</td>
                  <td style={{ padding: '0.75rem' }}>${row.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
