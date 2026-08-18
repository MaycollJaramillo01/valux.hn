export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function paypalBase() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function paypalToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('No se pudo autenticar con PayPal');
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPaypalOrder(amount: number, description: string, customId?: string) {
  const token = await paypalToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          custom_id: customId,
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: string }>;
}

export async function capturePaypalOrder(orderId: string) {
  const token = await paypalToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as {
    status?: string;
    id?: string;
    payer?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
    purchase_units?: {
      custom_id?: string;
      amount?: { value?: string };
      payments?: { captures?: { amount?: { value?: string } }[] };
    }[];
  };
  return data;
}

export function paypalCapturedAmount(captured: {
  purchase_units?: {
    amount?: { value?: string };
    payments?: { captures?: { amount?: { value?: string } }[] };
  }[];
}) {
  const raw =
    captured.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ??
    captured.purchase_units?.[0]?.amount?.value;
  const paid = Number(raw);
  return Number.isFinite(paid) && paid > 0 ? paid : null;
}

export function amountsMatch(expected: number, paid: number | null) {
  if (paid == null) return false;
  return Math.abs(expected - paid) < 0.02;
}

export function parseAssociateMonths(months: unknown) {
  const cycle = Number(months);
  if (cycle !== 3 && cycle !== 6 && cycle !== 12) return null;
  return cycle as 3 | 6 | 12;
}

export function parseAssociateCustomId(customId?: string | null) {
  if (!customId) return null;
  const match = customId.match(/^assoc:([^:]+):(3|6|12)$/);
  if (!match) return null;
  return { userId: match[1], months: Number(match[2]) as 3 | 6 | 12 };
}

export function parseDonationPledge(amount: unknown, months: unknown) {
  const monthlyCents = Math.round(Number(amount) * 100);
  const cycle = Number(months);
  if (!Number.isFinite(monthlyCents) || monthlyCents < 100 || monthlyCents > 500_000) {
    return null;
  }
  if (cycle !== 3 && cycle !== 6 && cycle !== 12) {
    return null;
  }
  return {
    monthlyAmount: monthlyCents / 100,
    months: cycle,
    total: (monthlyCents * cycle) / 100,
  };
}
