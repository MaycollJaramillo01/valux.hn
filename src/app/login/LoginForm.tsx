'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError('Credenciales incorrectas o cuenta sin confirmar. Revisá tu correo si acabás de registrarte.');
      return;
    }
    router.push(searchParams.get('callbackUrl') ?? '/catalogo');
    router.refresh();
  }

  const verificacion = searchParams.get('verificacion');

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {verificacion === 'ok' && !error && (
        <p className="auth-error" style={{ color: 'var(--royal)', borderColor: 'var(--royal)', background: 'rgba(30,80,160,.08)' }}>
          Cuenta confirmada. Ya podés iniciar sesión.
        </p>
      )}
      {verificacion === 'invalida' && !error && (
        <p className="auth-error">El enlace de verificación es inválido o venció.</p>
      )}
      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
      </div>
      <div className="auth-field">
        <label htmlFor="password" data-es="Contraseña" data-en="Password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
        <span data-es="Entrar" data-en="Sign in">{loading ? 'Entrando…' : 'Entrar'}</span>
        <span className="btn-glyph" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
