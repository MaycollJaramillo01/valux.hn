import { redirect } from 'next/navigation';

export default function SuscripcionPage() {
  redirect('/checkout?kind=SUBSCRIPTION');
}
