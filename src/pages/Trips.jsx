import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, CheckCircle2, XCircle, Search } from 'lucide-react';
import {
  getVehicles, getDrivers, getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
} from '../services/dataService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';
import { isVehicleAssignable, isDriverAssignable } from '../services/businessRules';

const EMPTY_FORM = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeightKg: '', plannedDistanceKm: '' };
const EMPTY_COMPLETE = { actualOdometer: '', fuelConsumedL: '', revenue: '' };

export default function Trips() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
  const [completeError, setCompleteError] = useState('');

  async function refresh() {
    setLoading(true);
    const [v, d, t] = await Promise.all([getVehicles(), getDrivers(), getTrips()]);
    setVehicles(v); setDrivers(d); setTrips(t);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const assignableVehicles = useMemo(() => vehicles.filter((v) => isVehicleAssignable(v).ok), [vehicles]);
  const assignableDrivers = useMemo(() => drivers.filter((d) => isDriverAssignable(d).ok), [drivers]);

  const enriched = useMemo(
    () => trips.map((t) => ({
      ...t,
      vehicleReg: vehicles.find((v) => v.id === t.vehicleId)?.regNo || '—',
      driverName: drivers.find((d) => d.id === t.driverId)?.name || '—',
    })),
    [trips, vehicles, drivers]
  );

  const filtered = useMemo(
    () => enriched.filter((t) =>
      (statusFilter === 'All' || t.status === statusFilter) &&
      `${t.source} ${t.destination} ${t.vehicleReg} ${t.driverName}`.toLowerCase().includes(search.toLowerCase())
    ),
    [enriched, statusFilter, search]
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setCreateOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createTrip(form);
      setCreateOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Could not create trip.');
    }
  }

  async function handleDispatch(id) {
    try {
      await dispatchTrip(id);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this trip?')) return;
    await cancelTrip(id);
    refresh();
  }

  function openComplete(trip) {
    setCompletingTrip(trip);
    setCompleteForm(EMPTY_COMPLETE);
    setCompleteError('');
    setCompleteOpen(true);
  }

  async function handleComplete(e) {
    e.preventDefault();
    setCompleteError('');
    try {
      await completeTrip(completingTrip.id, completeForm);
      setCompleteOpen(false);
      refresh();
    } catch (err) {
      setCompleteError(err.message || 'Could not complete trip.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search route, vehicle, driver…" className="pl-8" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </Select>
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus size={16} /> Create Trip
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((t) => (
              <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">{t.source} → {t.destination}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.vehicleReg}</td>
                <td className="px-4 py-3">{t.driverName}</td>
                <td className="px-4 py-3">{t.cargoWeightKg} kg</td>
                <td className="px-4 py-3">{t.plannedDistanceKm} km</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {t.status === 'Draft' && (
                      <button onClick={() => handleDispatch(t.id)} title="Dispatch" className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-[var(--color-info)]">
                        <Send size={15} />
                      </button>
                    )}
                    {t.status === 'Dispatched' && (
                      <button onClick={() => openComplete(t)} title="Complete" className="rounded-lg p-1.5 text-slate-500 hover:bg-green-50 hover:text-[var(--color-success)]">
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                    {(t.status === 'Draft' || t.status === 'Dispatched') && (
                      <button onClick={() => handleCancel(t.id)} title="Cancel" className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-[var(--color-danger)]">
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading trips…</p>}
        {!loading && filtered.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No trips match your filters.</p>}
      </div>

      {/* Create trip modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Trip">
        <form onSubmit={handleCreate}>
          {error && <div className="mb-3"><Alert variant="error">{error}</Alert></div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" required>
              <Input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </Field>
            <Field label="Destination" required>
              <Input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Field>
          </div>
          <Field label="Available Vehicle" required>
            <Select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select a vehicle…</option>
              {assignableVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.regNo} — {v.name} (max {v.maxLoadKg}kg)</option>
              ))}
            </Select>
            {assignableVehicles.length === 0 && <p className="mt-1 text-xs text-[var(--color-danger)]">No vehicles currently available for dispatch.</p>}
          </Field>
          <Field label="Available Driver" required>
            <Select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
              <option value="">Select a driver…</option>
              {assignableDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory}</option>
              ))}
            </Select>
            {assignableDrivers.length === 0 && <p className="mt-1 text-xs text-[var(--color-danger)]">No drivers currently eligible (check license/status).</p>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo Weight (kg)" required>
              <Input type="number" min="0" required value={form.cargoWeightKg} onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} />
            </Field>
            <Field label="Planned Distance (km)" required>
              <Input type="number" min="0" required value={form.plannedDistanceKm} onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">Create Trip (Draft)</Button>
          </div>
        </form>
      </Modal>

      {/* Complete trip modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title={`Complete Trip — ${completingTrip?.source} → ${completingTrip?.destination}`}>
        <form onSubmit={handleComplete}>
          {completeError && <div className="mb-3"><Alert variant="error">{completeError}</Alert></div>}
          <Field label="Final Odometer Reading (km)" required>
            <Input type="number" min="0" required value={completeForm.actualOdometer} onChange={(e) => setCompleteForm({ ...completeForm, actualOdometer: e.target.value })} />
          </Field>
          <Field label="Fuel Consumed (liters)" required>
            <Input type="number" min="0" step="0.1" required value={completeForm.fuelConsumedL} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedL: e.target.value })} />
          </Field>
          <Field label="Trip Revenue (₹)">
            <Input type="number" min="0" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} placeholder="Used for ROI reporting" />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">Mark Completed</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
