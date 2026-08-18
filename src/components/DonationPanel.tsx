'use client';

import { useEffect, useMemo, useState } from 'react';
import PayPalDonation from '@/components/PayPalDonation';

const PRESETS = [10, 25, 50] as const;
const TERMS: { months: 3 | 6 | 12; es: string; en: string }[] = [
  { months: 3, es: '3 meses', en: '3 months' },
  { months: 6, es: '6 meses', en: '6 months' },
  { months: 12, es: '1 año', en: '1 year' },
];

function money(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function DonationPanel({
  clientId,
  paypalReady,
}: {
  clientId: string;
  paypalReady: boolean;
}) {
  const [preset, setPreset] = useState<number | 'other'>(50);
  const [custom, setCustom] = useState('');
  const [months, setMonths] = useState<3 | 6 | 12>(3);

  const monthly = useMemo(() => {
    if (preset === 'other') {
      const n = Number(custom.replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    }
    return preset;
  }, [preset, custom]);

  const [paypalAmount, setPaypalAmount] = useState(monthly);

  useEffect(() => {
    if (monthly < 1 || monthly > 5000) return;
    const t = window.setTimeout(() => setPaypalAmount(monthly), 400);
    return () => window.clearTimeout(t);
  }, [monthly]);

  const valid = monthly >= 1 && monthly <= 5000;
  const total = valid ? Math.round(monthly * months * 100) / 100 : 0;

  return (
    <aside className="donation-panel reveal" id="donar">
      <span className="panel-kicker" data-es="Donación mensual" data-en="Monthly donation">
        Donación mensual
      </span>
      <strong>${valid ? money(monthly) : '—'}</strong>
      <p data-es="Impulsa una grabación, una mentoría o parte de un encuentro de creadores." data-en="Funds a recording, a mentorship session or part of a creator gathering.">
        Impulsa una grabación, una mentoría o parte de un encuentro de creadores.
      </p>

      <div className="amount-grid" role="group" aria-label="Monto mensual">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className={preset === value ? 'active' : ''}
            onClick={() => setPreset(value)}
          >
            ${value}
          </button>
        ))}
        <button
          type="button"
          className={preset === 'other' ? 'active' : ''}
          onClick={() => {
            setCustom(preset === 'other' ? custom : String(preset));
            setPreset('other');
          }}
        >
          Otro
        </button>
      </div>

      {preset === 'other' && (
        <label className="donation-custom">
          <span data-es="Monto mensual en USD" data-en="Monthly amount in USD">
            Monto mensual en USD
          </span>
          <input
            type="number"
            min={1}
            max={5000}
            step="1"
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="75"
            aria-label="Monto personalizado en dólares"
          />
        </label>
      )}

      <p className="panel-kicker" style={{ marginTop: '1.1rem' }} data-es="Compromiso (3, 6 o 12 meses)" data-en="Commitment (3, 6 or 12 months)">
        Compromiso (3, 6 o 12 meses)
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
            data-es={term.es}
            data-en={term.en}
          >
            {term.es}
          </button>
        ))}
      </div>

      <p className="donation-total">
        {valid ? (
          <>
            <span data-es={`${months === 12 ? '1 año' : `${months} meses`} · total`} data-en={`${months === 12 ? '1 year' : `${months} months`} · total`}>
              {months === 12 ? '1 año' : `${months} meses`} · total
            </span>
            <b>${money(total)} USD</b>
          </>
        ) : (
          <span data-es="Escribí un monto de al menos $1." data-en="Enter an amount of at least $1.">
            Escribí un monto de al menos $1.
          </span>
        )}
      </p>

      {paypalReady && clientId && paypalAmount >= 1 && paypalAmount <= 5000 ? (
        <PayPalDonation amount={paypalAmount} months={months} clientId={clientId} />
      ) : paypalReady ? null : (
        <p className="donation-wait">
          El cobro con PayPal todavía no está activo.
        </p>
      )}

      <small data-es="VALUX es una ONG. PayPal cobra ahora el total del compromiso (monto mensual × meses)." data-en="VALUX is an NGO. PayPal charges the full commitment now (monthly amount × months).">
        VALUX es una ONG. PayPal cobra ahora el total del compromiso (monto mensual × meses).
      </small>
    </aside>
  );
}
