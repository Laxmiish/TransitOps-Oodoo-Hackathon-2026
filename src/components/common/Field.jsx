export function Field({ label, children, required }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
        {label}{required && <span className="text-[var(--color-danger)]"> *</span>}
      </span>
      {children}
    </label>
  );
}

const baseInputCls =
  'w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-dark)] focus:ring-2 focus:ring-[var(--color-accent)]/30';

export function Input(props) {
  return <input {...props} className={`${baseInputCls} ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${baseInputCls} ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea {...props} className={`${baseInputCls} ${props.className || ''}`} />;
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-2)]',
    accent: 'bg-[var(--color-accent)] text-[var(--color-ink)] hover:bg-[var(--color-accent-dark)] hover:text-white',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-slate-100 border border-[var(--color-border)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}
