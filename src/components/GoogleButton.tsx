'use client';

import { signIn } from 'next-auth/react';

export default function GoogleButton({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-lg"
      style={{ width: '100%', marginBottom: '1rem' }}
      onClick={() => signIn('google', { callbackUrl: '/catalogo' })}
    >
      Continuar con Google
    </button>
  );
}
