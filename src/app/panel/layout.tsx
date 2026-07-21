import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/panel');
  }

  const role = (session.user as { role?: string }).role ?? 'USER';

  return (
    <>
      <SiteHeader />
      <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: '#f8fafc' }}>
        
        {/* BARRA LATERAL (SIDEBAR) */}
        <aside style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '2rem 1.5rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Mi Cuenta
            </p>
            <a href="/panel" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
              <span aria-hidden="true" style={{ marginRight: '8px' }}>📊</span> Dashboard
            </a>
            
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
              Sinergias
            </p>
            <a href="/panel/perfil" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
              <span aria-hidden="true" style={{ marginRight: '8px' }}>👤</span> Perfil de Creador
            </a>
            <a href="/panel/productos" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
              <span aria-hidden="true" style={{ marginRight: '8px' }}>📦</span> Mis Productos
            </a>

            {/* Renderizado condicional: Solo ADMIN y TEACHER ven esto */}
            {(role === 'TEACHER' || role === 'ADMIN') && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>
                  Administración
                </p>
                <a href="/panel/docencia" className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
                  <span aria-hidden="true" style={{ marginRight: '8px' }}>👨‍🏫</span> Panel Docente
                </a>
              </>
            )}
            
          </nav>
        </aside>

        {/* CONTENIDO DINÁMICO (Acá se inyecta page.tsx) */}
        <main style={{ flex: 1, padding: '2rem 3rem' }}>
          {children}
        </main>

      </div>
      <SiteFooter />
    </>
  );
}