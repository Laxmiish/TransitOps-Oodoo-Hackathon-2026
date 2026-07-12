export default function KPICard({ label, value, suffix = '', icon: Icon, accent = 'accent' }) {
  const accentMap = {
    accent: 'text-[var(--color-accent-dark)] bg-[color-mix(in_srgb,var(--color-accent)_16%,white)]',
    transit: 'text-[var(--color-transit)] bg-[color-mix(in_srgb,var(--color-transit)_14%,white)]',
    success: 'text-[var(--color-success)] bg-[var(--color-success-soft)]',
    danger: 'text-[var(--color-danger)] bg-[var(--color-danger-soft)]',
    info: 'text-[var(--color-info)] bg-[var(--color-info-soft)]',
  };
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        {Icon && (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${accentMap[accent]}`}>
            <Icon size={16} strokeWidth={2.2} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text-primary)]">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">{suffix}</span>}
      </p>
    </div>
  );
}
