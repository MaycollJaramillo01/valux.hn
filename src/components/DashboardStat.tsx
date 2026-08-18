export default function DashboardStat({
  label,
  value,
  hint,
  href,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <>
      <p
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: alert ? '#9a3412' : '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0 0.2rem', lineHeight: 1.1, color: '#0f172a' }}>
        {value}
      </p>
      {hint ? <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{hint}</p> : null}
    </>
  );

  const box = {
    background: '#fff',
    border: `1px solid ${alert ? '#fdba74' : '#e2e8f0'}`,
    padding: '1.2rem 1.35rem',
    display: 'block' as const,
    textDecoration: 'none',
    color: 'inherit',
    minHeight: 120,
  };

  if (href) {
    return (
      <a href={href} style={box}>
        {inner}
      </a>
    );
  }
  return <div style={box}>{inner}</div>;
}
