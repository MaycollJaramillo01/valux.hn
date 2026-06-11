export default function SiteFooter() {
  return (
    <footer className="footer footer-manifesto">
      <div className="container">
        <div className="footer-word" aria-hidden="true">VALUX</div>
        <div className="footer-grid">
          <div>
            <a href="/" className="brand">
              <span className="brand-word">VALUX</span>
              <span className="brand-territory">HN</span>
            </a>
            <p
              className="footer-tagline"
              data-es="Creadores de contenido construyendo valor desde Honduras."
              data-en="Content creators building value from Honduras."
            >
              Creadores de contenido construyendo valor desde Honduras.
            </p>
            <div className="socials" aria-label="Redes sociales">
              <a href="#" aria-label="Instagram">IG</a>
              <a href="#" aria-label="YouTube">YT</a>
              <a href="#" aria-label="TikTok">TT</a>
              <a href="#" aria-label="LinkedIn">IN</a>
              <a href="#" aria-label="X">X</a>
            </div>
          </div>
          <div>
            <h5 data-es="Explora" data-en="Explore">Explora</h5>
            <ul>
              <li><a href="/que-es" data-es="Qué es Valux" data-en="About">Qué es Valux</a></li>
              <li><a href="/como-funciona" data-es="Cómo funciona" data-en="How it works">Cómo funciona</a></li>
              <li><a href="/proyectos" data-es="Proyectos" data-en="Projects">Proyectos</a></li>
              <li><a href="/podcast" data-es="Podcast" data-en="Podcast">Podcast</a></li>
              <li><a href="/blog" data-es="Blog" data-en="Blog">Blog</a></li>
            </ul>
          </div>
          <div>
            <h5 data-es="Participa" data-en="Get involved">Participa</h5>
            <ul>
              <li><a href="/miembros" data-es="Aplicar a Valux" data-en="Apply to Valux">Aplicar a Valux</a></li>
              <li><a href="/aliados" data-es="Ser aliado" data-en="Become a partner">Ser aliado</a></li>
              <li><a href="/apoya" data-es="Donar" data-en="Donate">Donar</a></li>
              <li><a href="/contacto" data-es="Contacto" data-en="Contact">Contacto</a></li>
              <li><a href="mailto:hola@valux.hn">hola@valux.hn</a></li>
            </ul>
          </div>
          <div>
            <h5 data-es="Cursos" data-en="Courses">Cursos</h5>
            <ul>
              <li><a href="/cursos" data-es="Ver cursos" data-en="Browse courses">Ver cursos</a></li>
              <li><a href="/registro" data-es="Crear cuenta" data-en="Create account">Crear cuenta</a></li>
              <li><a href="/login" data-es="Iniciar sesión" data-en="Sign in">Iniciar sesión</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} VALUX.{' '}
            <span data-es="Todos los derechos reservados." data-en="All rights reserved.">
              Todos los derechos reservados.
            </span>
          </span>
          <span data-es="Hecho desde Honduras." data-en="Made from Honduras.">Hecho desde Honduras.</span>
        </div>
      </div>
    </footer>
  );
}
