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
        <section className="auth-section">
          <div className="auth-card">
            <div className="auth-card-head">
              <span className="auth-index">VX / 02</span>
              <span data-es="Nueva cuenta" data-en="New account">Nueva cuenta</span>
            </div>
            <div className="auth-card-body">
              <h1 className="auth-title" data-es="Crear cuenta" data-en="Create account">Crear cuenta</h1>
              <p
                className="auth-lead"
                data-es="Registrate para acceder a los cursos de la comunidad."
                data-en="Sign up to access the community's courses."
              >
                Registrate para acceder a los cursos de la comunidad.
              </p>
              <RegisterForm />
              <div className="auth-alt">
                <span data-es="¿Ya tenés cuenta?" data-en="Already have an account?">¿Ya tenés cuenta?</span>
                <a href="/login" data-es="Iniciar sesión" data-en="Sign in">Iniciar sesión</a>
              </div>
            </div>
            <div className="auth-foot">
              <span>VALUX / HN</span>
              <span data-es="Comunidad creativa" data-en="Creative community">Comunidad creativa</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
