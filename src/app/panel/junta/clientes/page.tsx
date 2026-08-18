import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { peopleQuery, searchNameOrEmail } from '@/lib/people-search';
import JuntaSearchBar from '@/components/JuntaSearchBar';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import type { CSSProperties } from 'react';

export const metadata = { title: 'Clientes - Junta VALUX' };
export const dynamic = 'force-dynamic';

type Filtro = 'todos' | 'suscripcion' | 'compras' | 'ambos' | 'sin';

const field: CSSProperties = {
  padding: '0.75rem',
  border: '1px solid #cbd5e1',
  fontFamily: 'inherit',
};

function subStatus(sub: { status: string; currentPeriodEnd: Date } | null, now: Date) {
  if (!sub) return { key: 'nunca' as const, label: 'Nunca' };
  if (sub.status === 'CANCELED') return { key: 'cancelada' as const, label: 'Cancelada' };
  if (sub.status === 'ACTIVE' && sub.currentPeriodEnd > now) {
    return { key: 'activa' as const, label: `Activa hasta ${sub.currentPeriodEnd.toLocaleDateString('es-HN')}` };
  }
  return { key: 'vencida' as const, label: `Vencida (${sub.currentPeriodEnd.toLocaleDateString('es-HN')})` };
}

function clientesHref(opts: { filtro: string; q?: string; id?: string }) {
  const params = new URLSearchParams();
  params.set('filtro', opts.filtro);
  if (opts.q) params.set('q', opts.q);
  if (opts.id) params.set('id', opts.id);
  return `/panel/junta/clientes?${params.toString()}`;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; id?: string; q?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const { filtro: rawFiltro, id, q: rawQ, error } = await searchParams;
  const q = peopleQuery(rawQ);
  const filtro = (['todos', 'suscripcion', 'compras', 'ambos', 'sin'].includes(rawFiltro || '')
    ? rawFiltro
    : 'todos') as Filtro;
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      role: { in: ['USER', 'MEMBER'] },
      ...searchNameOrEmail(q),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      subscriptions: { orderBy: { currentPeriodEnd: 'desc' }, take: 1 },
      enrollments: { select: { id: true } },
      purchases: { select: { id: true } },
      salesBought: {
        orderBy: { paidAt: 'desc' },
        include: { course: { select: { title: true } }, product: { select: { title: true } } },
      },
    },
  });

  const rows = users
    .map((user) => {
      const sub = user.subscriptions[0] ?? null;
      const status = subStatus(sub, now);
      const courseCount = user.enrollments.length;
      const productCount = user.purchases.length;
      const hasSub = status.key === 'activa';
      const hasCompras = courseCount > 0 || productCount > 0;
      return { user, sub, status, courseCount, productCount, hasSub, hasCompras };
    })
    .filter((row) => {
      if (filtro === 'suscripcion') return row.hasSub;
      if (filtro === 'compras') return row.hasCompras;
      if (filtro === 'ambos') return row.hasSub && row.hasCompras;
      if (filtro === 'sin') return !row.hasSub && !row.hasCompras;
      return true;
    });

  const selected = id ? rows.find((row) => row.user.id === id) : null;

  async function createClient(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    if (!name || name.length < 2 || !email.includes('@') || password.length < 8) {
      redirect('/panel/junta/clientes?error=datos');
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) redirect('/panel/junta/clientes?error=existe');
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'USER',
        emailVerified: new Date(),
      },
    });
    revalidatePath('/panel/junta/clientes');
    redirect('/panel/junta/clientes');
  }

  async function makeAssociate(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user || !isJunta((session.user as { role?: string }).role)) return;
    const userId = String(formData.get('id'));
    await prisma.user.update({ where: { id: userId }, data: { role: 'ASSOCIATE' } });
    revalidatePath('/panel/junta/clientes');
    revalidatePath('/panel/junta/asociados');
  }

  const filters: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'suscripcion', label: 'Con suscripción' },
    { id: 'compras', label: 'Compró ítems' },
    { id: 'ambos', label: 'Ambos' },
    { id: 'sin', label: 'Sin pagos' },
  ];

  return (
    <div>
      <h1>Clientes</h1>
      <p style={{ color: '#475569' }}>Compras y suscripciones pagadas.</p>

      <form
        action={createClient}
        style={{
          marginTop: '2rem',
          background: '#fff',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          alignItems: 'end',
        }}
      >
        <p style={{ gridColumn: '1 / -1', margin: 0, fontWeight: 700 }}>Nuevo cliente</p>
        {error === 'existe' ? (
          <p style={{ gridColumn: '1 / -1', margin: 0, color: '#b91c1c' }}>Ya hay una cuenta con ese email.</p>
        ) : null}
        {error === 'datos' ? (
          <p style={{ gridColumn: '1 / -1', margin: 0, color: '#b91c1c' }}>
            Revisá nombre, email y contraseña (mínimo 8 caracteres).
          </p>
        ) : null}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Nombre
          <input name="name" required minLength={2} style={field} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Email
          <input name="email" type="email" required style={field} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
          Contraseña inicial
          <input name="password" type="password" required minLength={8} autoComplete="new-password" style={field} />
        </label>
        <button type="submit" className="btn btn-primary">
          Crear
        </button>
      </form>

      <JuntaSearchBar action="/panel/junta/clientes" q={q} hidden={{ filtro }} />

      <p style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        {filters.map((item) => (
          <a
            key={item.id}
            href={clientesHref({ filtro: item.id, q })}
            className={filtro === item.id ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            {item.label}
          </a>
        ))}
      </p>

      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Suscripción</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Cursos</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Marketplace</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '1rem', color: '#64748b' }}>
                {q ? 'Nadie coincide con esa búsqueda.' : 'Nadie en este filtro.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.user.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{row.user.name}</td>
                <td style={{ padding: '0.75rem' }}>{row.user.email}</td>
                <td style={{ padding: '0.75rem' }}>{row.status.label}</td>
                <td style={{ padding: '0.75rem' }}>{row.courseCount}</td>
                <td style={{ padding: '0.75rem' }}>{row.productCount}</td>
                <td style={{ padding: '0.75rem' }}>
                  <a href={clientesHref({ filtro, q, id: row.user.id })} className="btn btn-ghost btn-sm">
                    Ver pagos
                  </a>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selected ? (
        <section style={{ marginTop: '2rem', background: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h2>
            {selected.user.name}{' '}
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>{selected.user.email}</span>
          </h2>
          <p style={{ color: '#475569' }}>
            Usuario · alta {selected.user.createdAt.toLocaleDateString('es-HN')} · {selected.status.label}
          </p>
          {selected.user.salesBought.length === 0 ? (
            <p>Todavía no hay cobros confirmados.</p>
          ) : (
            <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Qué pagó</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>USD</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {selected.user.salesBought.map((sale) => (
                  <tr key={sale.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.5rem' }}>{sale.paidAt.toLocaleDateString('es-HN')}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {sale.kind === 'SUBSCRIPTION'
                        ? 'Suscripción global'
                        : sale.course?.title || sale.product?.title || sale.kind}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>${sale.amountPaid.toFixed(2)}</td>
                    <td style={{ padding: '0.5rem' }}>{sale.paypalOrderId ? 'Cobro confirmado' : 'Cobro registrado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <form action={makeAssociate} style={{ marginTop: '1.25rem' }}>
            <input type="hidden" name="id" value={selected.user.id} />
            <button className="btn btn-ghost btn-sm">Pasar a asociado (Personas)</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
