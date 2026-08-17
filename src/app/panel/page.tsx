import { auth } from '@/auth';
import { roleLabel } from '@/lib/access';
import { canSellProducts, canTeachCourses, canWriteBlog, isJunta } from '@/lib/access';

export const metadata = { title: 'Dashboard - VALUX' };

export default async function PanelPage() {
  const session = await auth();
  const userName = session?.user?.name || 'VALUX';
  const userRole = (session?.user as { role?: string })?.role ?? 'USER';

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Hola, {userName}</h1>
        <p style={{ color: '#475569' }}>
          Tu acceso: <strong>{roleLabel(userRole)}</strong>.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3>Academia</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Formación y marketplace.</p>
          <a href="/catalogo" className="btn btn-primary btn-sm">Abrir catálogo</a>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3>Suscripción</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Todo el catálogo.</p>
          <a href="/suscripcion" className="btn btn-outline btn-sm">Ver suscripción</a>
        </div>
        {canWriteBlog(userRole) && (
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3>Blog</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{userRole === 'ADMIN' ? 'Notas nuevas.' : 'Enviar a revisión.'}</p>
            <a href="/panel/blog" className="btn btn-outline btn-sm">Ir al blog</a>
          </div>
        )}
        {canSellProducts(userRole) && (
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3>Marketplace</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Nuevo recurso.</p>
            <a href="/panel/productos/nuevo" className="btn btn-outline btn-sm">Nuevo recurso</a>
          </div>
        )}
        {canTeachCourses(userRole) && (
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3>Docencia</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Tus cursos.</p>
            <a href="/panel/docencia" className="btn btn-outline btn-sm">Mis cursos</a>
          </div>
        )}
        {isJunta(userRole) && (
          <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3>Junta</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Personas, clientes y cobros.</p>
            <a href="/panel/junta/suscripciones" className="btn btn-outline btn-sm">Suscripción</a>
          </div>
        )}
      </div>
    </div>
  );
}
