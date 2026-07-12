import { useEffect, useMemo, useState } from 'react';
import { Send, CheckCircle2, XCircle } from 'lucide-react';
import {
  getVehicles, getDrivers, getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
} from '../services/dataService';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';
import { isVehicleAssignable, isDriverAssignable } from '../services/businessRules';

const EMPTY_FORM = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeightKg: '', plannedDistanceKm: '' };
const EMPTY_COMPLETE = { actualDistanceKm: '', fuelConsumedL: '', revenue: '' };

const LIFECYCLE_STEPS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
const STEP_DOT = {
  done: 'bg-[var(--color-success)]',
  current: 'bg-[var(--color-info)] ring-4 ring-[var(--color-info-soft)]',
  upcoming: 'bg-[var(--color-surface-muted)]',
};

const STATUS_PILL = {
  Draft: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  Dispatched: 'bg-[var(--color-info)] text-white',
  Completed: 'bg-[var(--color-success)] text-white',
  Cancelled: 'bg-[var(--color-danger)] text-white',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[status] || STATUS_PILL.Draft}`}>
      {status}
    </span>
  );
}

function LifecycleStepper({ currentStatus }) {
  const currentIndex = Math.max(0, LIFECYCLE_STEPS.indexOf(currentStatus || 'Draft'));
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Trip Lifecycle</p>
      <div className="flex items-center">
        {LIFECYCLE_STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span className={`h-3 w-3 rounded-full ${STEP_DOT[state]}`} />
                <span className={`mt-1.5 text-[11px] ${state === 'upcoming' ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                  {step}
                </span>
              </div>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <div className={`mx-1.5 h-px flex-1 ${i < currentIndex ? 'bg-[var(--color-success)]' : 'bg-[var(--color-surface-muted)]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Trips() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(form.vehicleId)) || null,
    [vehicles, form.vehicleId]
  );

  const capacityExceededBy = useMemo(() => {
    if (!selectedVehicle || !form.cargoWeightKg) return 0;
    const over = Number(form.cargoWeightKg) - Number(selectedVehicle.maxLoadKg);
    return over > 0 ? over : 0;
  }, [selectedVehicle, form.cargoWeightKg]);

  const canDispatch =
    form.source && form.destination && form.vehicleId && form.driverId &&
    form.cargoWeightKg && form.plannedDistanceKm && capacityExceededBy === 0;

  const enriched = useMemo(
    () => trips
      .slice()
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .map((t) => ({
        ...t,
        vehicleReg: vehicles.find((v) => String(v.id) === String(t.vehicleId))?.regNo || null,
        driverName: drivers.find((d) => String(d.id) === String(t.driverId))?.name || null,
      })),
    [trips, vehicles, drivers]
  );

  function noteFor(t) {
    if (t.status === 'Dispatched') return t.eta || 'En route';
    if (t.status === 'Draft') return !t.vehicleReg || !t.driverName ? 'Awaiting vehicle & driver' : 'Awaiting dispatch';
    if (t.status === 'Cancelled') return t.cancelReason || 'Trip cancelled';
    if (t.status === 'Completed') return 'Trip completed';
    return '—';
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createTrip(form);
      setForm(EMPTY_FORM);
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
      await completeTrip(completingTrip.id, {
        actualDistanceKm: completeForm.actualDistanceKm,
        fuelConsumedL: completeForm.fuelConsumedL,
        revenue: completeForm.revenue,
      });
      setCompleteOpen(false);
      refresh();
    } catch (err) {
      setCompleteError(err.message || 'Could not complete trip.');
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Left: lifecycle + create form */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5">
          <LifecycleStepper currentStatus="Dispatched" />
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5">
          <p className="mb-3 font-display text-sm font-semibold text-[var(--color-text-primary)]">Create Trip</p>
          <form onSubmit={handleCreate}>
            {error && <div className="mb-3"><Alert variant="error">{error}</Alert></div>}
            <Field label="Source" required>
              <Input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </Field>
            <Field label="Destination" required>
              <Input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Field>
            <Field label="Vehicle (available only)" required>
              <Select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select a vehicle…</option>
                {assignableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.regNo} — {v.maxLoadKg} kg capacity</option>
                ))}
              </Select>
            </Field>
            <Field label="Driver (available only)" required>
              <Select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Select a driver…</option>
                {assignableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cargo Weight (kg)" required>
                <Input type="number" min="0" required value={form.cargoWeightKg} onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} />
              </Field>
              <Field label="Planned Distance (km)" required>
                <Input type="number" min="0" required value={form.plannedDistanceKm} onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })} />
              </Field>
            </div>

            {capacityExceededBy > 0 && selectedVehicle && (
              <div className="mb-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-xs text-[var(--color-danger)]">
                <p>Vehicle Capacity: {selectedVehicle.maxLoadKg} kg</p>
                <p>Cargo Weight: {form.cargoWeightKg} kg</p>
                <p className="mt-1 font-medium">✕ Capacity exceeded by {capacityExceededBy} kg — dispatch blocked</p>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setForm(EMPTY_FORM)}>Cancel</Button>
              <Button type="submit" variant="accent" disabled={!canDispatch}>
                {canDispatch ? 'Dispatch' : 'Dispatch (Disabled)'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right: live board */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5">
        <p className="mb-3 font-display text-sm font-semibold text-[var(--color-text-primary)]">Live Board</p>

        {loading && <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">Loading trips…</p>}
        {!loading && enriched.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No trips yet.</p>}

        <div className="max-h-[520px] space-y-0 overflow-y-auto">
          {enriched.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-3 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">{t.id}</span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">
                    {t.vehicleReg && t.driverName ? `${t.vehicleReg} / ${t.driverName}` : 'Unassigned'}
                  </span>
                </div>
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{t.source} → {t.destination}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusPill status={t.status} />
                  <span className="text-xs text-[var(--color-text-muted)]">{noteFor(t)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {t.status === 'Draft' && (
                  <button onClick={() => handleDispatch(t.id)} title="Dispatch" className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-info-soft)] hover:text-[var(--color-info)]">
                    <Send size={15} />
                  </button>
                )}
                {t.status === 'Dispatched' && (
                  <button onClick={() => openComplete(t)} title="Complete" className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-success-soft)] hover:text-[var(--color-success)]">
                    <CheckCircle2 size={15} />
                  </button>
                )}
                {(t.status === 'Draft' || t.status === 'Dispatched') && (
                  <button onClick={() => handleCancel(t.id)} title="Cancel" className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]">
                    <XCircle size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
          On Complete: odometer → fuel log → expenses → vehicle &amp; driver available
        </p>
      </div>

      {/* Complete trip modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title={`Complete Trip — ${completingTrip?.source} → ${completingTrip?.destination}`}>
        <form onSubmit={handleComplete}>
          {completeError && <div className="mb-3"><Alert variant="error">{completeError}</Alert></div>}
          <Field label="Actual Distance Driven (km)" required>
            <Input type="number" min="0" required value={completeForm.actualDistanceKm} onChange={(e) => setCompleteForm({ ...completeForm, actualDistanceKm: e.target.value })} placeholder="e.g. 245" />
          </Field>
          <Field label="Fuel Consumed (liters)" required>
            <Input type="number" min="0" step="0.1" required value={completeForm.fuelConsumedL} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedL: e.target.value })} placeholder="e.g. 32.5" />
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