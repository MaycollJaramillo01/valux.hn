import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { canSellProducts, canTeachCourses, canWriteBlog, isJunta } from '@/lib/access';
import { roleLabel } from '@/lib/access';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
      {children}
    </a>
  );
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/panel');
  const role = (session.user as { role?: string }).role ?? 'USER';
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, mustChangePassword: true },
  });
  if (dbUser && !dbUser.isActive) redirect('/login');

  return (
    <>
      <SiteHeader />
      <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: '#f8fafc' }}>
        <aside style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '2rem 1.5rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
              {roleLabel(role)}
            </p>
            <NavLink href="/panel">Dashboard</NavLink>
            {(canSellProducts(role) || canTeachCourses(role)) && (
              <NavLink href="/panel/ventas">Mis ventas</NavLink>
            )}
            <NavLink href="/catalogo">Academia</NavLink>

            {(canWriteBlog(role) || canSellProducts(role)) && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
                  Publicar
                </p>
                {canWriteBlog(role) && <NavLink href="/panel/blog">Blog</NavLink>}
                {canSellProducts(role) && <NavLink href="/panel/productos">Marketplace</NavLink>}
              </>
            )}

            {canTeachCourses(role) && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
                  Docencia
                </p>
                <NavLink href="/panel/docencia">Mis cursos</NavLink>
                <NavLink href="/panel/cursos/nuevo">Nuevo curso</NavLink>
              </>
            )}

            {isJunta(role) && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
                  Junta
                </p>
                <NavLink href="/panel/junta/revisiones">Revisiones</NavLink>
                <NavLink href="/panel/junta/asociados">Personas</NavLink>
                <NavLink href="/panel/junta/clientes">Clientes</NavLink>
                <NavLink href="/panel/junta/suscripciones">Suscripción</NavLink>
                <NavLink href="/panel/junta/liquidaciones">Liquidaciones</NavLink>
              </>
            )}

            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
              Cuenta
            </p>
            <NavLink href="/panel/perfil">Perfil</NavLink>
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '2rem 3rem' }}>{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}
