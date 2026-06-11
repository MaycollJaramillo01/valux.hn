import { Suspense } from 'react';
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
        <section className="auth-section">
          <div className="auth-card">
            <div className="auth-card-head">
              <span className="auth-index">VX / 01</span>
              <span data-es="Acceso" data-en="Access">Acceso</span>
            </div>
            <div className="auth-card-body">
              <h1 className="auth-title" data-es="Iniciar sesión" data-en="Sign in">Iniciar sesión</h1>
              <p
                className="auth-lead"
                data-es="Accedé a los cursos y clases de la comunidad."
                data-en="Access the community's courses and classes."
              >
                Accedé a los cursos y clases de la comunidad.
              </p>
              <Suspense>
                <LoginForm />
              </Suspense>
              <div className="auth-alt">
                <span data-es="¿No tenés cuenta?" data-en="No account yet?">¿No tenés cuenta?</span>
                <a href="/registro" data-es="Crear cuenta" data-en="Create account">Crear cuenta</a>
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
