'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  amount: number;
  months: 3 | 6 | 12;
  clientId: string;
};

type PaypalButtons = {
  render: (el: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => PaypalButtons;
    };
  }
}

export default function PayPalDonation({ amount, months, clientId }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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
            body: JSON.stringify({ kind: 'DONATION', amount, months }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'No se pudo crear la donación');
          return data.id;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID, kind: 'DONATION' }),
          });
          const payload = await res.json();
          if (!res.ok) {
            setError(payload.error || 'No se pudo confirmar la donación');
            return;
          }
          window.location.href = payload.href || '/apoya/gracias';
        },
        onError: () => {
          if (!cancelled) setError('PayPal no pudo completar la donación.');
        },
      });
      buttons.render(host.current).catch(() => {
        /* PayPal can reject if the host was replaced during a re-render. */
      });
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
  }, [amount, months, clientId]);

  return (
    <div className="donation-paypal">
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <div ref={host} />
    </div>
  );
}
