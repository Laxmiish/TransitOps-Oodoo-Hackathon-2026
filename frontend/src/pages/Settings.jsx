import { useState } from 'react';
import { Field, Input, Select, Button } from '../components/common/Field';
import Alert from '../components/common/Alert';
import { useAuth } from '../context/AuthContext';
import { createUser } from '../services/dataService';

const ROLES = [
  { role: 'Fleet Manager', fleet: 'edit', drivers: 'edit', trips: 'none', fuelExp: 'edit', analytics: 'edit' },
  { role: 'Dispatcher', fleet: 'view', drivers: 'none', trips: 'edit', fuelExp: 'none', analytics: 'none' },
  { role: 'Safety Officer', fleet: 'none', drivers: 'edit', trips: 'view', fuelExp: 'none', analytics: 'none' },
  { role: 'Financial Analyst', fleet: 'view', drivers: 'none', trips: 'none', fuelExp: 'edit', analytics: 'edit' },
];

const ROLE_IDS = {
  'Admin': 1,
  'Fleet Manager': 2,
  'Driver': 3,
  'Safety Officer': 4,
  'Financial Analyst': 5,
  'Dispatcher': 6,
};

function AccessMark({ level }) {
  if (level === 'edit') return <span className="text-[var(--color-success)]">✓</span>;
  if (level === 'view') return <span className="text-[var(--color-text-muted)]">view</span>;
  return <span className="text-[var(--color-text-muted)]">—</span>;
}

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [general, setGeneral] = useState({
    depotName: 'Sambhrant Depot #24',
    currency: 'INR (₹)',
    distanceUnit: 'Kilometers',
  });
  const [saved, setSaved] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Driver' });
  const [userMsg, setUserMsg] = useState(null);

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setUserMsg(null);
    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role_id: ROLE_IDS[newUser.role]
      });
      setUserMsg({ type: 'success', text: 'User added successfully!' });
      setNewUser({ name: '', email: '', password: '', role: 'Driver' });
    } catch (err) {
      setUserMsg({ type: 'error', text: err.message || 'Failed to add user' });
    }
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

      {/* RIGHT: Role-Based Access & User Management */}
      <div className="space-y-8">
        
        {/* User Management (Admin Only) */}
        {isAdmin && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              User Management
            </h2>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
              <h3 className="mb-4 text-sm font-semibold">Add New User</h3>
              {userMsg && <Alert variant={userMsg.type === 'error' ? 'danger' : 'success'}>{userMsg.text}</Alert>}
              <form onSubmit={handleAddUser} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" required>
                    <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                  </Field>
                  <Field label="Email Address" required>
                    <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Password" required>
                    <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                  </Field>
                  <Field label="Role" required>
                    <Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      {Object.keys(ROLE_IDS).map(r => <option key={r}>{r}</option>)}
                    </Select>
                  </Field>
                </div>
                <Button type="submit" variant="accent">Create User</Button>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Role-Based Access (RBAC)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)]">
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
                  <tr key={r.role} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]">
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
    </div>
  );
}
