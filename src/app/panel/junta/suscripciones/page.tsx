import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isJunta } from '@/lib/access';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Suscriptores del blog' };

export default async function NewsletterAdminPage() {
  const session = await auth();
  if (!session?.user || !isJunta((session.user as { role?: string }).role)) redirect('/panel');

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const platformSubs = await prisma.platformSubscription.findMany({
    orderBy: { startedAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1>Suscripciones</h1>
      <section style={{ margin: '2rem 0' }}>
        <h2>Newsletter del blog</h2>
        <p>{subscribers.filter((s) => !s.unsubscribedAt).length} activos</p>
        <ul>
          {subscribers.map((s) => (
            <li key={s.id}>
              {s.email} · desde {s.createdAt.toLocaleDateString('es-HN')}
              {s.unsubscribedAt ? ' · baja' : ''}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Suscripción de plataforma (acceso a todo)</h2>
        <ul>
          {platformSubs.map((s) => (
            <li key={s.id}>
              {s.user.name} · {s.user.email} · {s.status} · desde {s.startedAt.toLocaleDateString('es-HN')} hasta{' '}
              {s.currentPeriodEnd.toLocaleDateString('es-HN')}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
