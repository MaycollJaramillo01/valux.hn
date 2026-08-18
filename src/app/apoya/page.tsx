import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import DonationPanel from '@/components/DonationPanel';
import { paypalConfigured } from '@/lib/paypal';

export const metadata = { title: 'Apoya Valux - Doná a creadores hondureños' };
export const dynamic = 'force-dynamic';

export default function ApoyaPage() {
  const clientId = process.env.PAYPAL_CLIENT_ID ?? '';
  const paypalReady = paypalConfigured() && Boolean(clientId);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="donation-hero dark-section">
          <div className="container donation-hero-grid">
            <div className="donation-hero-copy reveal">
              <span className="eyebrow" data-es="Apoya Valux" data-en="Support Valux">
                Apoya Valux
              </span>
              <h1 data-es="Tu donación produce comunidad." data-en="Your donation produces community.">
                Tu donación produce comunidad.
              </h1>
              <p
                className="lead"
                data-es="Priorizamos la donación porque cada aporte se convierte en producción, formación, encuentros y oportunidades para creadores hondureños."
                data-en="We prioritize donations because every contribution becomes production, training, gatherings and opportunities for Honduran creators."
              >
                Priorizamos la donación porque cada aporte se convierte en producción, formación, encuentros y oportunidades para creadores hondureños.
              </p>
              <div className="donation-hero-actions">
                <a href="#donar" className="btn btn-primary btn-lg">
                  <span data-es="Donar ahora" data-en="Donate now">
                    Donar ahora
                  </span>
                  <span className="btn-glyph" aria-hidden="true">
                    ↗
                  </span>
                </a>
                <a href="/contacto" className="btn btn-ghost btn-lg" data-es="Donación empresarial" data-en="Corporate donation">
                  Donación empresarial
                </a>
              </div>
            </div>
            <DonationPanel clientId={clientId} paypalReady={paypalReady} />
          </div>
        </section>

        <section className="impact-strip">
          <div className="container impact-strip-grid reveal">
            <div>
              <strong>+30</strong>
              <span data-es="creadores activos" data-en="active creators">
                creadores activos
              </span>
            </div>
            <div>
              <strong>+12</strong>
              <span data-es="proyectos vivos" data-en="live projects">
                proyectos vivos
              </span>
            </div>
            <div>
              <strong>1</strong>
              <span data-es="ecosistema por construir" data-en="ecosystem to build">
                ecosistema por construir
              </span>
            </div>
          </div>
        </section>

        <section className="donation-levels">
          <div className="container">
            <div className="section-intro reveal">
              <span className="eyebrow" data-es="Niveles de apoyo" data-en="Support levels">
                Niveles de apoyo
              </span>
              <h2 data-es="Elegí el tamaño del empuje." data-en="Choose the size of the push.">
                Elegí el tamaño del empuje.
              </h2>
            </div>
            <div className="donation-level-grid">
              <article className="donation-level reveal">
                <span>01</span>
                <h3 data-es="Aliado mensual" data-en="Monthly ally">
                  Aliado mensual
                </h3>
                <strong>$10</strong>
                <p data-es="Sostiene logística básica, reuniones y recursos para miembros." data-en="Supports basic logistics, meetings and resources for members.">
                  Sostiene logística básica, reuniones y recursos para miembros.
                </p>
                <a href="#donar" className="read" data-es="Donar $10 →" data-en="Donate $10 →">
                  Donar $10 →
                </a>
              </article>
              <article className="donation-level featured reveal">
                <span>02</span>
                <h3 data-es="Patrocinador" data-en="Sponsor">
                  Patrocinador
                </h3>
                <strong>$50</strong>
                <p data-es="Ayuda a producir videos, podcast, mentorías y encuentros." data-en="Helps produce videos, podcasts, mentorships and gatherings.">
                  Ayuda a producir videos, podcast, mentorías y encuentros.
                </p>
                <a href="#donar" className="btn btn-primary" data-es="Donar $50" data-en="Donate $50">
                  Donar $50
                </a>
              </article>
              <article className="donation-level reveal">
                <span>03</span>
                <h3 data-es="Cooperante" data-en="Cooperator">
                  Cooperante
                </h3>
                <strong data-es="A medida" data-en="Custom">
                  A medida
                </strong>
                <p data-es="Para empresas, fundaciones, universidades y organismos." data-en="For companies, foundations, universities and organizations.">
                  Para empresas, fundaciones, universidades y organismos.
                </p>
                <a href="/contacto" className="read" data-es="Conversemos →" data-en="Let's talk →">
                  Conversemos →
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="impact-stories bg-soft">
          <div className="container">
            <div className="section-intro reveal">
              <span className="eyebrow" data-es="Impacto" data-en="Impact">
                Impacto
              </span>
              <h2 data-es="Tu aporte se ve en producción real." data-en="Your support shows up in real production.">
                Tu aporte se ve en producción real.
              </h2>
            </div>
            <div className="impact-story-grid">
              <article className="impact-story reveal">
                <div className="impact-type" aria-hidden="true">
                  PRODUCCIÓN
                </div>
                <div>
                  <span data-es="Producción" data-en="Production">
                    Producción
                  </span>
                  <h3 data-es="Videos y podcast con estándar editorial." data-en="Videos and podcasts with editorial standards.">
                    Videos y podcast con estándar editorial.
                  </h3>
                </div>
              </article>
              <article className="impact-story reveal">
                <div className="impact-type" aria-hidden="true">
                  FORMACIÓN
                </div>
                <div>
                  <span data-es="Formación" data-en="Training">
                    Formación
                  </span>
                  <h3 data-es="Mentorías, talleres y encuentros de creadores." data-en="Mentorships, workshops and creator gatherings.">
                    Mentorías, talleres y encuentros de creadores.
                  </h3>
                </div>
              </article>
              <article className="impact-story reveal">
                <div className="impact-type" aria-hidden="true">
                  OPORTUNIDAD
                </div>
                <div>
                  <span data-es="Oportunidad" data-en="Opportunity">
                    Oportunidad
                  </span>
                  <h3 data-es="Puentes entre creadores, marcas y aliados." data-en="Bridges between creators, brands and allies.">
                    Puentes entre creadores, marcas y aliados.
                  </h3>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="donation-final-cta">
          <div className="container donation-final-grid reveal">
            <h2 data-es="Donar es tomar posición por la industria creativa hondureña." data-en="Donating is taking a position for the Honduran creative industry.">
              Donar es tomar posición por la industria creativa hondureña.
            </h2>
            <div>
              <p data-es="Si Valux debe existir con fuerza, necesita comunidad y respaldo. Empezá con una donación." data-en="If Valux is to exist with force, it needs community and backing. Start with a donation.">
                Si Valux debe existir con fuerza, necesita comunidad y respaldo. Empezá con una donación.
              </p>
              <a href="#donar" className="btn btn-primary btn-lg" data-es="Donar ahora" data-en="Donate now">
                Donar ahora
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <div className="floating-actions">
        <a href="#donar" className="float-btn float-donate">
          <span data-es="Donar" data-en="Donate">
            Donar
          </span>
        </a>
        <a href="https://wa.me/50400000000" target="_blank" rel="noopener" className="float-btn float-whatsapp">
          <span>WhatsApp</span>
        </a>
      </div>
    </>
  );
}
