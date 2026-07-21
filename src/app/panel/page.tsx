import { auth } from '@/auth';

export const metadata = { title: 'Dashboard - VALUX' };

export default async function PanelPage() {
  const session = await auth();
  const userName = session?.user?.name || 'Creador';
  const userRole = (session?.user as { role?: string })?.role ?? 'USER';

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Hola, {userName}</h1>
        <p style={{ color: '#475569' }}>
          Bienvenido a tu panel de control. Tu nivel de acceso actual es: <strong>{userRole}</strong>.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Directorio de Sinergias</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Completa tu biografía, nicho y enlaces para aparecer en la comunidad pública.
          </p>
          <a href="/panel/perfil" className="btn btn-outline btn-sm">Editar mi perfil</a>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Vende en el Marketplace</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Sube tus presets, plantillas o herramientas digitales y monetiza tu conocimiento.
          </p>
          <a href="/panel/productos/nuevo" className="btn btn-primary btn-sm">Publicar recurso</a>
        </div>

      </div>
    </div>
  );
}
