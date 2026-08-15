export const DEFAULT_COMMISSION_PERCENT = 30;

export function splitPrice(price: number, commissionPercent = DEFAULT_COMMISSION_PERCENT) {
  const amount = Math.max(0, Number(price) || 0);
  const rate = Math.min(100, Math.max(0, commissionPercent)) / 100;
  const valuxFee = Math.round(amount * rate * 100) / 100;
  const sellerAmount = Math.round((amount - valuxFee) * 100) / 100;
  return { amount, valuxFee, sellerAmount, commissionPercent };
}

export function periodYm(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** El día 10 del mes siguiente al periodo de ventas. */
export function payoutDueAt(period: string) {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, 10, 23, 59, 59);
}

export function payoutDueLabel(period: string) {
  return payoutDueAt(period).toLocaleDateString('es-HN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72) || 'entrada';
}
