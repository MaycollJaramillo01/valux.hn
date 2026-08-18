'use client';

import { useEffect, useRef, useState } from 'react';
import type { PaypalButtons } from '@/types/paypal';

const TERMS: { months: 3 | 6 | 12; label: string }[] = [
  { months: 3, label: '3 meses' },
  { months: 6, label: '6 meses' },
  { months: 12, label: '1 año' },
];

export default function AssociateCheckout({
  monthly,
  clientId,
}: {
  monthly: number;
  clientId: string;
}) {
  const [months, setMonths] = useState<3 | 6 | 12>(3);
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const total = Math.round(monthly * months * 100) / 100;

  useEffect(() => {
    const scriptId = 'paypal-sdk';
    let cancelled = false;
    let buttons: PaypalButtons | null = null;

    function renderButtons() {
      if (cancelled || !host.current || !window.paypal) return;
      buttons = window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
        createOrder: async () => {
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'SUBSCRIPTION', months }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'No se pudo crear el pago');
          return data.id;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const payload = await res.json();
          if (!res.ok) {
            setError(payload.error || 'No se pudo confirmar el pago');
            return;
          }
          window.location.href = payload.href || '/panel';
        },
        onError: () => {
          if (!cancelled) setError('PayPal no pudo completar la operación.');
        },
      });
      buttons.render(host.current).catch(() => undefined);
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing && window.paypal) {
      renderButtons();
    } else {
      const script = existing ?? document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.onload = renderButtons;
      if (!existing) document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      buttons?.close?.().catch(() => undefined);
    };
  }, [months, clientId]);

  return (
    <div>
      <p className="panel-kicker" style={{ marginTop: '1.5rem' }}>
        Compromiso
      </p>
      <div className="commitment-grid" role="radiogroup" aria-label="Duración del compromiso">
        {TERMS.map((term) => (
          <button
            key={term.months}
            type="button"
            role="radio"
            aria-checked={months === term.months}
            className={months === term.months ? 'active' : ''}
            onClick={() => setMonths(term.months)}
          >
            {term.label}
          </button>
        ))}
      </div>
      <p className="donation-total">
        <span>
          ${monthly.toFixed(2)} / mes · {months === 12 ? '1 año' : `${months} meses`}
        </span>
        <b>${total.toFixed(2)} USD</b>
      </p>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
        PayPal cobra ahora el total. Pasás a asociado: catálogo completo, blog y marketplace en revisión de junta.
      </p>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <div ref={host} />
    </div>
  );
}
