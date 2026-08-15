import { redirect } from 'next/navigation';

export default function CursosIndexRedirect() {
  redirect('/catalogo#formacion');
}
