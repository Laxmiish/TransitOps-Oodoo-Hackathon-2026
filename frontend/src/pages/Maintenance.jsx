import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getVehicles, getMaintenance, createMaintenance, closeMaintenance } from '../services/dataService';
import StatusBadge from '../components/common/StatusBadge';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Textarea, Button } from '../components/common/Field';

const EMPTY_FORM = { vehicleId: '', type: '', description: '', cost: '', date: new Date().toISOString().slice(0, 10) };

export default function Maintenance() {
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const [v, m] = await Promise.all([getVehicles(), getMaintenance()]);
    setVehicles(v); setRecords(m);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const enriched = useMemo(
    () => records.map((r) => ({ ...r, vehicleReg: vehicles.find((v) => v.id === r.vehicleId)?.regNo || '—' })),
    [records, vehicles]
  );

  // Vehicles not already In Shop can be sent for maintenance; retired vehicles excluded.
  const eligibleVehicles = useMemo(() => vehicles.filter((v) => v.status !== 'Retired'), [vehicles]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createMaintenance({ ...form, cost: Number(form.cost) });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err.message || 'Could not create maintenance record.');
    } finally {
      setSaving(false);
    }
  }

  async function handleClose(id) {
    await closeMaintenance(id);
    refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {/* LEFT: Log Service Record — always visible, no modal */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Log Service Record
        </h2>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Vehicle" required>
            <Select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select a vehicle…</option>
              {eligibleVehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
            </Select>
          </Field>
          <Field label="Service Type" required>
            <Input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Oil Change, Brake Overhaul" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Cost (₹)" required>
            <Input type="number" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="2500" />
          </Field>
          <Field label="Date" required>
            <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Status">
            <Input disabled value="Active" />
          </Field>

          <Button type="submit" variant="accent" disabled={saving} className="w-full justify-center">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </form>

        <Alert variant="info">
          Adding a vehicle to a maintenance log automatically switches its status to <strong>In Shop</strong>, removing it from the dispatch pool. Closing the log restores it to <strong>Available</strong> (unless retired).
        </Alert>
      </div>

      {/* RIGHT: Service Log table */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Service Log
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && enriched.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.vehicleReg}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">₹{Number(r.cost).toLocaleString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'Active' && (
                      <button onClick={() => handleClose(r.id)} title="Close maintenance" className="rounded-lg p-1.5 text-slate-500 hover:bg-green-50 hover:text-[var(--color-success)]">
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading maintenance records…</p>}
          {!loading && enriched.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No maintenance records yet.</p>}
        </div>
      </div>
    </div>
  );
}