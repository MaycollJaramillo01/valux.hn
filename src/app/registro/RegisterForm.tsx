'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email');
    const password = form.get('password');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'No se pudo crear la cuenta. Intentá de nuevo.');
      setLoading(false);
      return;
    }

    // Cuenta creada: iniciar sesión automáticamente.
    await signIn('credentials', { email, password, redirect: false });
    router.push('/cursos');
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name" data-es="Nombre completo" data-en="Full name">Nombre completo</label>
        <input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password" data-es="Contraseña (mínimo 8 caracteres)" data-en="Password (min. 8 characters)">
          Contraseña (mínimo 8 caracteres)
        </label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <span data-es="Crear cuenta" data-en="Create account">{loading ? 'Creando…' : 'Crear cuenta'}</span>
          <span className="arrow">→</span>
        </button>
        {error && (
          <span className="form-status" style={{ fontSize: '.9rem', color: '#b3261e' }}>{error}</span>
        )}
      </div>
      <p style={{ fontSize: '.9rem' }}>
        <span data-es="¿Ya tenés cuenta? " data-en="Already have an account? ">¿Ya tenés cuenta? </span>
        <a href="/login" data-es="Iniciá sesión" data-en="Sign in">Iniciá sesión</a>
      </p>
    </form>
  );
}
