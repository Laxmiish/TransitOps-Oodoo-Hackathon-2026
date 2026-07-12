import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ShieldAlert } from 'lucide-react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../services/dataService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';
import { DRIVER_STATUSES, isLicenseExpired } from '../services/businessRules';

const EMPTY_FORM = { name: '', licenseNo: '', licenseCategory: 'LMV', licenseExpiry: '', contact: '', safetyScore: 100, status: 'Available' };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

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
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or license no…" className="pl-8" />
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Safety Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((d) => {
              const expired = isLicenseExpired(d);
              return (
                <tr key={d.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.licenseNo}</td>
                  <td className="px-4 py-3">{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    <span className={expired ? 'flex items-center gap-1 font-medium text-[var(--color-danger)]' : ''}>
                      {expired && <ShieldAlert size={13} />}
                      {d.licenseExpiry}
                    </span>
                  </td>
                  <td className="px-4 py-3">{d.safetyScore}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[var(--color-ink)]">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-[var(--color-danger)]">
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
