import { useState } from 'react';
import { Field, Input, Select, Button } from '../components/common/Field';
import Alert from '../components/common/Alert';

const ROLES = [
  { role: 'Fleet Manager', fleet: 'edit', drivers: 'edit', trips: 'none', fuelExp: 'edit', analytics: 'edit' },
  { role: 'Dispatcher', fleet: 'view', drivers: 'none', trips: 'edit', fuelExp: 'none', analytics: 'none' },
  { role: 'Safety Officer', fleet: 'none', drivers: 'edit', trips: 'view', fuelExp: 'none', analytics: 'none' },
  { role: 'Financial Analyst', fleet: 'view', drivers: 'none', trips: 'none', fuelExp: 'edit', analytics: 'edit' },
];

function AccessMark({ level }) {
  if (level === 'edit') return <span className="text-[var(--color-success)]">✓</span>;
  if (level === 'view') return <span className="text-[var(--color-text-muted)]">view</span>;
  return <span className="text-[var(--color-text-muted)]">—</span>;
}

export default function Settings() {
  const [general, setGeneral] = useState({
    depotName: 'Sambhrant Depot #24',
    currency: 'INR (₹)',
    distanceUnit: 'Kilometers',
  });
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    // Persist however the app currently stores settings (e.g. call an updateSettings API here).
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      {/* LEFT: General settings */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          General
        </h2>

        {saved && <Alert variant="success">Settings saved.</Alert>}

        <form onSubmit={handleSave} className="space-y-3">
          <Field label="Depot Name" required>
            <Input
              required
              value={general.depotName}
              onChange={(e) => setGeneral({ ...general, depotName: e.target.value })}
            />
          </Field>
          <Field label="Currency" required>
            <Select
              value={general.currency}
              onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
            >
              {['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)'].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Distance Unit" required>
            <Select
              value={general.distanceUnit}
              onChange={(e) => setGeneral({ ...general, distanceUnit: e.target.value })}
            >
              {['Kilometers', 'Miles'].map((u) => <option key={u}>{u}</option>)}
            </Select>
          </Field>

          <Button type="submit" variant="accent">
            Save changes
          </Button>
        </form>
      </div>

      {/* RIGHT: Role-Based Access */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Role-Based Access (RBAC)
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Fleet</th>
                <th className="px-4 py-3">Drivers</th>
                <th className="px-4 py-3">Trips</th>
                <th className="px-4 py-3">Fuel/Exp.</th>
                <th className="px-4 py-3">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.role}</td>
                  <td className="px-4 py-3"><AccessMark level={r.fleet} /></td>
                  <td className="px-4 py-3"><AccessMark level={r.drivers} /></td>
                  <td className="px-4 py-3"><AccessMark level={r.trips} /></td>
                  <td className="px-4 py-3"><AccessMark level={r.fuelExp} /></td>
                  <td className="px-4 py-3"><AccessMark level={r.analytics} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}