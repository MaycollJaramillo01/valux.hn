import { redirect } from 'next/navigation';

export default function MembresiaRedirect() {
  redirect('/checkout?kind=SUBSCRIPTION');
}
