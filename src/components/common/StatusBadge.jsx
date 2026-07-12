const STYLES = {
  Available: { dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-soft)]' },
  'On Trip': { dot: 'bg-[var(--color-info)]', text: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-soft)]' },
  'In Shop': { dot: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-soft)]' },
  Retired: { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
  'Off Duty': { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
  Suspended: { dot: 'bg-[var(--color-danger)]', text: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-soft)]' },
  Draft: { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
  Dispatched: { dot: 'bg-[var(--color-info)]', text: 'text-[var(--color-info)]', bg: 'bg-[var(--color-info-soft)]' },
  Completed: { dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-soft)]' },
  Cancelled: { dot: 'bg-[var(--color-danger)]', text: 'text-[var(--color-danger)]', bg: 'bg-[var(--color-danger-soft)]' },
  Active: { dot: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]', bg: 'bg-[var(--color-warning-soft)]' },
  Closed: { dot: 'bg-[var(--color-success)]', text: 'text-[var(--color-success)]', bg: 'bg-[var(--color-success-soft)]' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
