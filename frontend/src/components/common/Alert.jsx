import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const VARIANTS = {
  error: { icon: AlertTriangle, cls: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-red-200' },
  success: { icon: CheckCircle2, cls: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-green-200' },
  info: { icon: Info, cls: 'bg-[var(--color-info-soft)] text-[var(--color-info)] border-blue-200' },
};

export default function Alert({ variant = 'info', children }) {
  const v = VARIANTS[variant];
  const Icon = v.icon;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${v.cls}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
