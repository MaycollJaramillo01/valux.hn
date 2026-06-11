import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión - VALUX' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/cursos');

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-soft">
          <div className="container container-narrow">
            <div className="section-head center">
              <span className="eyebrow" data-es="Cuenta" data-en="Account">Cuenta</span>
              <h2 data-es="Iniciar sesión" data-en="Sign in">Iniciar sesión</h2>
              <p
                className="lead"
                data-es="Accedé a los cursos y clases de la comunidad."
                data-en="Access the community's courses and classes."
              >
                Accedé a los cursos y clases de la comunidad.
              </p>
            </div>
            <LoginForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
