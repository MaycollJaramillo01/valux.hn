import { auth } from '@/auth';
import { roleLabel } from '@/lib/access';
import { canSellProducts, canTeachCourses, isJunta, associateSeatActive } from '@/lib/access';
import { applicationStatusLabel } from '@/lib/applications';
import {
  associateOverview,
  juntaOverview,
  memberOverview,
  teacherOverview,
  usd,
} from '@/lib/dashboard';
import DashboardStat from '@/components/DashboardStat';
import type { CSSProperties } from 'react';

export const metadata = { title: 'Dashboard - VALUX' };
export const dynamic = 'force-dynamic';

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
};

function saleLabel(sale: {
  kind: string;
  course: { title: string } | null;
  product: { title: string } | null;
}) {
  if (sale.kind === 'SUBSCRIPTION') return 'Asociación';
  return sale.course?.title || sale.product?.title || sale.kind;
}

export default async function PanelPage() {
  const session = await auth();
  const userName = session?.user?.name || 'VALUX';
  const userRole = (session?.user as { role?: string })?.role ?? 'USER';
  const userId = session?.user?.id;
  const seat = userId ? await associateSeatActive(userId, userRole) : false;
  const showJoin = userRole === 'USER' || userRole === 'MEMBER' || (userRole === 'ASSOCIATE' && !seat);

  return (
    <div>
      <header style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>Hola, {userName}</h1>
        <p style={{ color: '#475569', margin: 0 }}>
          Tu acceso: <strong>{roleLabel(userRole)}</strong>. Números de VALUX ahora.
        </p>
      </header>

      {showJoin ? (
        <p
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.5rem',
          }}
        >
          Asociate un año y desbloqueás el catálogo.{' '}
          <a href="/suscripcion">Conviértete en asociado</a>
        </p>
      ) : null}

      {isJunta(userRole) ? <JuntaDash /> : null}
      {!isJunta(userRole) && canTeachCourses(userRole) && userId ? <TeacherDash userId={userId} /> : null}
      {!isJunta(userRole) && !canTeachCourses(userRole) && canSellProducts(userRole) && seat && userId ? (
        <AssociateDash userId={userId} />
      ) : null}
      {!isJunta(userRole) && !canTeachCourses(userRole) && !(canSellProducts(userRole) && seat) && userId ? (
        <MemberDash userId={userId} />
      ) : null}
    </div>
  );
}

async function JuntaDash() {
  const data = await juntaOverview();
  const [year, monthNum] = data.month.split('-').map(Number);
  const monthLabel = new Date(year, monthNum - 1, 1).toLocaleDateString('es-HN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div style={grid}>
        <DashboardStat
          label="Cursos publicados"
          value={String(data.coursesPublished)}
          hint={`${data.coursesTotal} en total · ${data.enrollments} inscripciones`}
          href="/panel/docencia"
        />
        <DashboardStat
          label="Asociados"
          value={String(data.associates)}
          hint={`${data.seatsActive} asientos con año vigente`}
          href="/panel/junta/asociados"
        />
        <DashboardStat
          label="Clientes"
          value={String(data.clients)}
          hint="Cuentas de usuario y suscriptor"
          href="/panel/junta/clientes"
        />
        <DashboardStat
          label="Fichas por revisar"
          value={String(data.fichasOpen)}
          hint="Nuevas o en revisión"
          href="/panel/junta/aplicaciones"
          alert={data.fichasOpen > 0}
        />
        <DashboardStat
          label={`Cobrado ${monthLabel}`}
          value={usd(data.monthTotal)}
          hint={`${data.monthCount} pagos · ${usd(data.allTimeTotal)} histórico`}
          href="/panel/junta/liquidaciones"
        />
        <DashboardStat
          label="Donaciones"
          value={usd(data.donationsTotal)}
          hint={`${data.donationsCount} aportes confirmados`}
          href="/panel/junta/donaciones"
        />
        <DashboardStat
          label="En revisión"
          value={String(data.reviewsOpen)}
          hint={`${data.postsPending} blog · ${data.productsPending} marketplace`}
          href="/panel/junta/revisiones"
          alert={data.reviewsOpen > 0}
        />
        <DashboardStat
          label="Novedades"
          value={String(data.newsletter)}
          hint="Correos activos de la lista"
          href="/panel/junta/suscripciones"
        />
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Últimos cobros</h2>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Qué</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Quién</th>
              <th style={{ textAlign: 'right', padding: '0.7rem' }}>USD</th>
            </tr>
          </thead>
          <tbody>
            {data.recentSales.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '0.9rem', color: '#64748b' }}>
                  Todavía no hay cobros confirmados.
                </td>
              </tr>
            ) : (
              data.recentSales.map((sale) => (
                <tr key={sale.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.7rem' }}>{sale.paidAt.toLocaleDateString('es-HN')}</td>
                  <td style={{ padding: '0.7rem' }}>{saleLabel(sale)}</td>
                  <td style={{ padding: '0.7rem' }}>{sale.buyer.name}</td>
                  <td style={{ padding: '0.7rem', textAlign: 'right' }}>{usd(sale.amountPaid)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Fichas recientes</h2>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.7rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recentApps.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '0.9rem', color: '#64748b' }}>
                  Nadie ha enviado ficha todavía.
                </td>
              </tr>
            ) : (
              data.recentApps.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.7rem' }}>
                    <a href={`/panel/junta/aplicaciones?filtro=todas&id=${row.id}`}>{row.fullName}</a>
                  </td>
                  <td style={{ padding: '0.7rem' }}>{row.email}</td>
                  <td style={{ padding: '0.7rem' }}>{applicationStatusLabel(row.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

async function TeacherDash({ userId }: { userId: string }) {
  const data = await teacherOverview(userId);
  return (
    <>
      <div style={grid}>
        <DashboardStat label="Mis cursos" value={String(data.courseCount)} hint={`${data.published} publicados`} href="/panel/docencia" />
        <DashboardStat label="Alumnos inscritos" value={String(data.enrollments)} hint="Suma de inscripciones" href="/panel/docencia" />
        <DashboardStat label="Lecciones" value={String(data.lessons)} href="/panel/docencia" />
      </div>
      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.7rem' }}>Curso</th>
            <th style={{ textAlign: 'right', padding: '0.7rem' }}>Lecciones</th>
            <th style={{ textAlign: 'right', padding: '0.7rem' }}>Alumnos</th>
          </tr>
        </thead>
        <tbody>
          {data.courses.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '0.9rem', color: '#64748b' }}>
                Todavía no tenés cursos.{' '}
                <a href="/panel/cursos/nuevo">Crear uno</a>
              </td>
            </tr>
          ) : (
            data.courses.map((course) => (
              <tr key={course.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.7rem' }}>
                  <a href={`/panel/${course.slug}`}>{course.title}</a>
                  {course.published ? '' : ' · borrador'}
                </td>
                <td style={{ padding: '0.7rem', textAlign: 'right' }}>{course._count.lessons}</td>
                <td style={{ padding: '0.7rem', textAlign: 'right' }}>{course._count.enrollments}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

async function AssociateDash({ userId }: { userId: string }) {
  const data = await associateOverview(userId);
  return (
    <div style={grid}>
      <DashboardStat
        label="Recursos publicados"
        value={String(data.productsPublished)}
        hint={data.productsPending ? `${data.productsPending} en revisión` : 'Marketplace'}
        href="/panel/productos"
      />
      <DashboardStat label="Tu parte este mes" value={usd(data.monthEarn)} hint={`${data.monthSales} ventas`} href="/panel/ventas" />
      <DashboardStat label="Cursos que cursás" value={String(data.enrollments)} href="/catalogo" />
    </div>
  );
}

async function MemberDash({ userId }: { userId: string }) {
  const data = await memberOverview(userId);
  return (
    <div style={grid}>
      <DashboardStat label="Cursos inscritos" value={String(data.enrollments)} href="/catalogo" />
      <DashboardStat label="Recursos comprados" value={String(data.purchases)} href="/catalogo" />
    </div>
  );
}
