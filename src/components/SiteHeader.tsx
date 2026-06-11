import { auth, signOut } from '@/auth';

export default async function SiteHeader() {
  const session = await auth();

  return (
    <header className="site-header">
      <div className="container">
        <a href="/" className="brand" aria-label="VALUX inicio">
          <span className="brand-word">VALUX</span>
          <span className="brand-territory">HN</span>
        </a>
        <nav className="nav-main" aria-label="Navegación principal">
          <ul className="nav-list">
            <li><a href="/" data-es="Inicio" data-en="Home">Inicio</a></li>
            <li><a href="/que-es" data-es="Qué es Valux" data-en="About">Qué es Valux</a></li>
            <li><a href="/como-funciona" data-es="Cómo funciona" data-en="How it works">Cómo funciona</a></li>
            <li><a href="/miembros" data-es="Miembros" data-en="Members">Miembros</a></li>
            <li><a href="/proyectos" data-es="Proyectos" data-en="Projects">Proyectos</a></li>
            <li><a href="/podcast" data-es="Podcast" data-en="Podcast">Podcast</a></li>
            <li><a href="/aliados" data-es="Aliados" data-en="Partners">Aliados</a></li>
            <li><a href="/blog" data-es="Blog" data-en="Blog">Blog</a></li>
            <li><a href="/contacto" data-es="Contacto" data-en="Contact">Contacto</a></li>
            <li><a href="/cursos" data-es="Cursos" data-en="Courses">Cursos</a></li>
          </ul>
          <div className="nav-cta">
            <div className="lang-toggle" role="group" aria-label="Cambiar idioma">
              <button type="button" data-lang="es">ES</button>
              <button type="button" data-lang="en">EN</button>
            </div>
            {session?.user && ['TEACHER', 'ADMIN'].includes((session.user as { role?: string }).role ?? '') && (
              <a href="/panel" className="btn btn-ghost btn-sm" data-es="Panel" data-en="Panel">
                Panel
              </a>
            )}
            {session?.user ? (
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button type="submit" className="btn btn-primary btn-sm" data-es="Salir" data-en="Sign out">
                  Salir
                </button>
              </form>
            ) : (
              <a href="/login" className="btn btn-primary btn-sm" data-es="Entrar" data-en="Sign in">
                Entrar
              </a>
            )}
            <button className="nav-toggle" type="button" aria-label="Abrir menú"><span></span></button>
          </div>
        </nav>
      </div>
    </header>
  );
}
