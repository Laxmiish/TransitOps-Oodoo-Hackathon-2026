import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waypoints, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, Input, Button } from '../components/common/Field';

const DEMO_ACCOUNTS = [
  { role: 'Fleet Manager', email: 'fleet.manager@transitops.io' },
  { role: 'Driver', email: 'driver@transitops.io' },
  { role: 'Safety Officer', email: 'safety.officer@transitops.io' },
  { role: 'Financial Analyst', email: 'analyst@transitops.io' },
];

const BOARD_ROWS = [
  { route: 'LUCKNOW HUB → KANPUR DC', veh: 'UP32-CD-2077', status: 'DISPATCHED' },
  { route: 'DELHI WAREHOUSE → GURUGRAM', veh: 'DL01-GH-4520', status: 'COMPLETED' },
  { route: 'PUNE YARD → NASHIK STORE', veh: 'MH04-KL-6784', status: 'DRAFT' },
  { route: 'LUCKNOW HUB → AYODHYA', veh: 'UP32-AB-1042', status: 'CANCELLED' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Signature panel: live-departure-board */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-ink)] p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]">
            <Waypoints size={20} className="text-[var(--color-ink)]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-white">TransitOps</p>
            <p className="text-xs text-[var(--color-text-onink)]">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="board-panel rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-widest text-[var(--color-text-onink)]">
            <span>DISPATCH BOARD</span>
            <span className="board-flicker text-[var(--color-accent)]">● LIVE</span>
          </div>
          {BOARD_ROWS.map((row) => (
            <div key={row.route} className="board-row grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5 font-mono text-xs">
              <span className="truncate text-white">{row.route}</span>
              <span className="text-[var(--color-text-onink)]">{row.veh}</span>
              <span className="text-[var(--color-accent)]">{row.status}</span>
            </div>
          ))}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-[var(--color-text-onink)]">
          One console for vehicle lifecycle, dispatch, maintenance, and cost —
          replacing the spreadsheet logbook with real-time operational control.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--color-surface)] p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-ink)]">
              <Waypoints size={18} className="text-[var(--color-accent)]" />
            </div>
            <p className="font-display text-lg font-semibold">TransitOps</p>
          </div>

          <h2 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">Sign in to your fleet</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Enter your credentials to access the operations console.</p>

          <form onSubmit={handleSubmit} className="mt-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <Field label="Email address" required>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field label="Password" required>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <Button type="submit" variant="accent" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Demo accounts · password123</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('password123'); }}
                  className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-left hover:border-[var(--color-accent)] hover:bg-[var(--color-warning-soft)]"
                >
                  <span className="block font-medium text-[var(--color-text-primary)]">{acc.role}</span>
                  <span className="text-[var(--color-text-muted)]">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
