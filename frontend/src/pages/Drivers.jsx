import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ShieldAlert } from 'lucide-react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/dataService';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';
import { DRIVER_STATUSES, isLicenseExpired } from '../services/businessRules';

const EMPTY_FORM = { name: '', licenseNo: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '', safetyScore: 100, status: 'Available' };

const STATUS_PILL = {
  Available: 'bg-[var(--color-success)] text-white',
  'On Trip': 'bg-[var(--color-info)] text-white',
  'Off Duty': 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  Suspended: 'bg-[var(--color-warning)] text-white',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[status] || STATUS_PILL['Off Duty']}`}>
      {status}
    </span>
  );
}

const TOGGLE_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toggleError, setToggleError] = useState('');

  async function refresh() {
    setLoading(true);
    setDrivers(await getDrivers());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(
    () => drivers.filter((d) => `${d.name} ${d.licenseNo}`.toLowerCase().includes(search.toLowerCase())),
    [drivers, search]
  );

  const selectedDriver = useMemo(() => drivers.find((d) => d.id === selectedId) || null, [drivers, selectedId]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }
  function openEdit(d) {
    setEditingId(d.id);
    setForm({ ...d });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) };
      if (editingId) await updateDriver(editingId, payload);
      else await createDriver(payload);
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this driver profile?')) return;
    await deleteDriver(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  async function handleToggleStatus(status) {
    if (!selectedDriver) return;
    setToggleError('');
    try {
      await updateDriver(selectedDriver.id, { ...selectedDriver, status });
      refresh();
    } catch (err) {
      setToggleError(err.message || 'Could not update status.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or license no…" className="pl-8" />
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Trip Compl.</th>
              <th className="px-4 py-3">Safety</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((d) => {
              const expired = isLicenseExpired(d);
              const isSelected = selectedId === d.id;
              return (
                <tr
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)] ${
                    isSelected ? 'bg-[var(--color-surface-muted)]' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-primary)]">{d.licenseNo}</td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    <span className={expired ? 'flex items-center gap-1 font-medium text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'}>
                      {expired && <ShieldAlert size={13} />}
                      {d.licenseExpiry}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{d.contact}</td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">{d.tripCompletionRate ?? '—'}{d.tripCompletionRate != null ? '%' : ''}</td>
                  <td className="px-4 py-3 text-[var(--color-text-primary)]">{d.safetyScore}%</td>
                  <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading drivers…</p>}
        {!loading && filtered.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No drivers match your search.</p>}
      </div>

      {/* Quick status toggle */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Toggle Status{selectedDriver ? ` — ${selectedDriver.name}` : ' (select a driver row above)'}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_STATUSES.map((s) => (
            <button
              key={s}
              disabled={!selectedDriver}
              onClick={() => handleToggleStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${STATUS_PILL[s]}`}
            >
              {s}
            </button>
          ))}
        </div>
        {toggleError && <p className="mt-2 text-xs text-[var(--color-danger)]">{toggleError}</p>}
        <p className="mt-3 text-xs text-[var(--color-danger)]">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </p>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit}>
          {error && <div className="mb-3"><Alert variant="error">{error}</Alert></div>}
          <Field label="Full Name" required>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="License Number" required>
            <Input required value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License Category" required>
              <Select value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                {['LMV', 'HMV', 'MC', 'HGMV'].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="License Expiry" required>
              <Input type="date" required value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </Field>
          </div>
          <Field label="Contact Number" required>
            <Input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Safety Score (0-100)" required>
              <Input type="number" min="0" max="100" required value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </Field>
            <Field label="Status" required>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {DRIVER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">{editingId ? 'Save Changes' : 'Add Driver'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}