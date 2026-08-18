'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  kind: 'COURSE' | 'PRODUCT' | 'SUBSCRIPTION';
  itemId?: string;
  clientId: string;
};

export default function PayPalCheckout({ kind, itemId, clientId }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = 'paypal-sdk';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    function renderButtons() {
      if (!host.current || !window.paypal) return;
      host.current.innerHTML = '';
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind, id: itemId }),
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
        onError: () => setError('PayPal no pudo completar la operación.'),
      }).render(host.current);
    }

    if (existing && window.paypal) {
      renderButtons();
      return;
    }

    const script = existing ?? document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = renderButtons;
    if (!existing) document.body.appendChild(script);
  }, [kind, itemId, clientId]);

  return (
    <div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div ref={host} />
    </div>
  );
}
