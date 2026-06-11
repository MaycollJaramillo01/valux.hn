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
      setError('Email o contraseña incorrectos.');
      return;
    }
    router.push(searchParams.get('callbackUrl') ?? '/cursos');
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password" data-es="Contraseña" data-en="Password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <span data-es="Entrar" data-en="Sign in">{loading ? 'Entrando…' : 'Entrar'}</span>
          <span className="arrow">→</span>
        </button>
        {error && (
          <span className="form-status" style={{ fontSize: '.9rem', color: '#b3261e' }}>{error}</span>
        )}
      </div>
      <p style={{ fontSize: '.9rem' }}>
        <span data-es="¿No tenés cuenta? " data-en="No account yet? ">¿No tenés cuenta? </span>
        <a href="/registro" data-es="Registrate" data-en="Sign up">Registrate</a>
      </p>
    </form>
  );
}
