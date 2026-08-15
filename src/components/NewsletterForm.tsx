'use client';

import { useState } from 'react';

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get('email') || '');
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? 'ok' : 'error');
  }

  if (status === 'ok') {
    return <p style={{ fontWeight: 600, margin: 0 }}>Listo. Te avisamos cuando haya una publicación nueva en el blog.</p>;
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input type="email" name="email" required placeholder="tu@email.com" aria-label="Email" />
      <button type="submit">Suscribirme</button>
      {status === 'error' && <p role="alert">No se pudo guardar el correo.</p>}
    </form>
  );
}
