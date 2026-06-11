import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RegisterForm from './RegisterForm';

export const metadata = { title: 'Crear cuenta - VALUX' };

export default async function RegisterPage() {
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
              <h2 data-es="Crear cuenta" data-en="Create account">Crear cuenta</h2>
              <p
                className="lead"
                data-es="Registrate para acceder a los cursos de la comunidad."
                data-en="Sign up to access the community's courses."
              >
                Registrate para acceder a los cursos de la comunidad.
              </p>
            </div>
            <RegisterForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
