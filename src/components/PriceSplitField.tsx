'use client';

import { useMemo, useState } from 'react';
import { splitPrice } from '@/lib/commission';

export default function PriceSplitField({
  name = 'price',
  defaultValue = 0,
  commissionPercent,
}: {
  name?: string;
  defaultValue?: number;
  commissionPercent: number;
}) {
  const [price, setPrice] = useState(defaultValue);
  const split = useMemo(() => splitPrice(price, commissionPercent), [price, commissionPercent]);

  return (
    <div>
      <label htmlFor={name} style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
        Precio al público (USD)
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <span style={{ fontWeight: 700 }}>$</span>
        <input
          type="number"
          id={name}
          name={name}
          min="0"
          step="0.01"
          value={Number.isFinite(price) ? price : 0}
          onChange={(e) => setPrice(Number(e.target.value))}
          style={{ padding: '0.75rem', border: '1px solid #cbd5e1', fontFamily: 'inherit', maxWidth: '160px' }}
          required
        />
      </div>
      <p style={{ marginTop: '0.85rem', fontSize: '0.9rem', color: '#334155' }}>
        El usuario paga <strong>${split.amount.toFixed(2)}</strong>. VALUX {split.commissionPercent}%:{' '}
        <strong>${split.valuxFee.toFixed(2)}</strong>. Vos:{' '}
        <strong>${split.sellerAmount.toFixed(2)}</strong>.
      </p>
    </div>
  );
}
