import type { CSSProperties } from 'react';

const field: CSSProperties = {
  padding: '0.75rem',
  border: '1px solid #cbd5e1',
  fontFamily: 'inherit',
  width: '100%',
};

export default function JuntaSearchBar({
  action,
  q,
  hidden,
}: {
  action: string;
  q: string;
  hidden?: Record<string, string>;
}) {
  const clearParams = new URLSearchParams(hidden);
  const clearHref = clearParams.toString() ? `${action}?${clearParams.toString()}` : action;

  return (
    <form
      method="get"
      action={action}
      role="search"
      style={{
        marginTop: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        alignItems: 'end',
      }}
    >
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <label style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
        Buscar
        <input name="q" type="search" defaultValue={q} placeholder="Nombre o email" style={field} />
      </label>
      <button type="submit" className="btn btn-primary btn-sm">
        Buscar
      </button>
      {q ? (
        <a href={clearHref} className="btn btn-ghost btn-sm">
          Limpiar
        </a>
      ) : null}
    </form>
  );
}
