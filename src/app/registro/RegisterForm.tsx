'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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

    const data = await res.json().catch(() => null);
    if (data?.verificationRequired) {
      // Hay que confirmar el correo antes de poder entrar.
      setLoading(false);
      setPendingEmail(String(email));
      return;
    }

    // Cuenta activa de inmediato: iniciar sesión automáticamente.
    await signIn('credentials', { email, password, redirect: false });
    router.push('/catalogo');
    router.refresh();
  }

  if (pendingEmail) {
    return (
      <div className="auth-form">
        <p className="auth-lead" style={{ margin: 0 }}>
          <span data-es="Te enviamos un correo a " data-en="We sent an email to ">Te enviamos un correo a </span>
          <strong>{pendingEmail}</strong>
          <span
            data-es=". Abrí el enlace para confirmar tu cuenta y después iniciá sesión."
            data-en=". Open the link to confirm your account, then sign in."
          >
            . Abrí el enlace para confirmar tu cuenta y después iniciá sesión.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="name" data-es="Nombre completo" data-en="Full name">Nombre completo</label>
        <input id="name" name="name" type="text" required autoComplete="name" placeholder="Tu nombre" />
      </div>
      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@email.com" />
      </div>
      <div className="auth-field">
        <label htmlFor="password" data-es="Contraseña" data-en="Password">Contraseña</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
        <span className="auth-hint" data-es="Mínimo 8 caracteres" data-en="At least 8 characters">Mínimo 8 caracteres</span>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
        <span data-es="Crear cuenta" data-en="Create account">{loading ? 'Creando…' : 'Crear cuenta'}</span>
        <span className="btn-glyph" aria-hidden="true">→</span>
      </button>
    </form>
  );
}
