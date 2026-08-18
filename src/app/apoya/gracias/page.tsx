import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata = { title: 'Gracias por donar - VALUX' };

export default function DonationThanksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-soft">
          <div className="container" style={{ maxWidth: 640, padding: '5rem 1.5rem' }}>
            <p className="eyebrow">Apoya Valux</p>
            <h1 style={{ textTransform: 'none' }}>Gracias. Ya está en marcha.</h1>
            <p className="lead">
              PayPal confirmó la donación. Ese respaldo se convierte en producción, formación y encuentros para creadores hondureños.
            </p>
            <a href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Volver al inicio
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
