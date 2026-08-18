import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { applicationFieldLabels, applicationStatusLabel } from '@/lib/applications';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ApplicationStatus } from '@prisma/client';

export const metadata = { title: 'Aplicaciones - Junta VALUX' };
export const dynamic = 'force-dynamic';

type Filtro = 'abiertas' | 'todas' | 'aceptadas' | 'rechazadas';

export default async function JuntaAplicacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; id?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !isJunta(role)) redirect('/panel');

  const { filtro: rawFiltro, id } = await searchParams;
  const filtro = (
    ['abiertas', 'todas', 'aceptadas', 'rechazadas'].includes(rawFiltro || '') ? rawFiltro : 'abiertas'
  ) as Filtro;

  const where =
    filtro === 'aceptadas'
      ? { status: 'ACCEPTED' as const }
      : filtro === 'rechazadas'
        ? { status: 'REJECTED' as const }
        : filtro === 'todas'
          ? {}
          : { status: { in: ['NEW', 'REVIEWING'] as ApplicationStatus[] } };

  const applications = await prisma.membershipApplication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  const detail = id
    ? await prisma.membershipApplication.findUnique({ where: { id } })
    : applications[0] ?? null;

  async function setStatus(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const applicationId = String(formData.get('id') || '');
    const next = String(formData.get('status') || '');
    if (!['NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED'].includes(next)) return;
    const notes = String(formData.get('notes') || '').trim();
    await prisma.membershipApplication.update({
      where: { id: applicationId },
      data: { status: next as ApplicationStatus, notes: notes || null },
    });
    revalidatePath('/panel/junta/aplicaciones');
  }

  const filters: { id: Filtro; label: string }[] = [
    { id: 'abiertas', label: 'Abiertas' },
    { id: 'todas', label: 'Todas' },
    { id: 'aceptadas', label: 'Aceptadas' },
    { id: 'rechazadas', label: 'Rechazadas' },
  ];

  const notifyReady = Boolean(process.env.APPLICATION_NOTIFY_EMAIL?.trim() && process.env.RESEND_API_KEY);

  return (
    <div>
      <h1>Fichas de ingreso</h1>
      <p style={{ color: '#475569', marginBottom: '1rem' }}>
        Aplicaciones a la membresía. {applications.length} en esta vista.
        {notifyReady
          ? ' También llegan por correo.'
          : ' El correo de aviso se activa cuando carguen esa dirección.'}
      </p>

      <p style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0 0 1.5rem' }}>
        {filters.map((item) => (
          <a
            key={item.id}
            href={`/panel/junta/aplicaciones?filtro=${item.id}`}
            className={filtro === item.id ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            {item.label}
          </a>
        ))}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 1.2fr)', gap: '1.5rem' }}>
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Quién</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '1rem', color: '#64748b' }}>
                    No hay fichas en esta vista.
                  </td>
                </tr>
              ) : (
                applications.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <a href={`/panel/junta/aplicaciones?filtro=${filtro}&id=${row.id}`}>
                        {row.fullName}
                        <small style={{ display: 'block', color: '#64748b' }}>
                          {row.phone} · {row.createdAt.toLocaleDateString('es-HN')}
                        </small>
                      </a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{applicationStatusLabel(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          {!detail ? (
            <p style={{ color: '#64748b' }}>Elegí una ficha para verla.</p>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{detail.fullName}</h2>
              <p style={{ color: '#64748b', marginTop: 0 }}>
                {applicationStatusLabel(detail.status)} · {detail.createdAt.toLocaleString('es-HN')}
              </p>
              {detail.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.photoUrl}
                  alt={`Foto de ${detail.fullName}`}
                  style={{ width: '160px', height: '160px', objectFit: 'cover', border: '1px solid #e2e8f0', marginBottom: '1rem' }}
                />
              ) : null}
              <dl style={{ display: 'grid', gap: '0.85rem', margin: '0 0 1.5rem' }}>
                {applicationFieldLabels.map(({ key, label }) => {
                  if (key === 'photoUrl') return null;
                  const value = detail[key];
                  if (typeof value !== 'string' || !value) return null;
                  return (
                    <div key={key}>
                      <dt style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                        {label}
                      </dt>
                      <dd style={{ margin: '0.2rem 0 0', whiteSpace: 'pre-wrap' }}>{value}</dd>
                    </div>
                  );
                })}
              </dl>
              <form action={setStatus} style={{ display: 'grid', gap: '0.75rem' }}>
                <input type="hidden" name="id" value={detail.id} />
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Notas de junta
                  <textarea name="notes" rows={3} defaultValue={detail.notes ?? ''} style={{ width: '100%', marginTop: '0.35rem' }} />
                </label>
                <p style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: 0 }}>
                  <button className="btn btn-ghost btn-sm" name="status" value="REVIEWING">
                    En revisión
                  </button>
                  <button className="btn btn-primary btn-sm" name="status" value="ACCEPTED">
                    Aceptar
                  </button>
                  <button className="btn btn-ghost btn-sm" name="status" value="REJECTED">
                    Rechazar
                  </button>
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Aceptar no crea la cuenta ni cobra. Si ya tiene usuario, marcalo como asociado en Personas.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
