export function searchNameOrEmail(q?: string | null) {
  const term = (q || '').trim().slice(0, 80);
  if (!term) return {};
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' as const } },
      { email: { contains: term, mode: 'insensitive' as const } },
    ],
  };
}

export function peopleQuery(q?: string | null) {
  return (q || '').trim().slice(0, 80);
}
