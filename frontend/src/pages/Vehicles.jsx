import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../services/dataService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';
import { VEHICLE_STATUSES } from '../services/businessRules';

const EMPTY_FORM = { regNo: '', name: '', type: 'Van', maxLoadKg: '', odometer: '', acquisitionCost: '', status: 'Available', region: 'North' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setVehicles(await getVehicles());
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(
    () => vehicles.filter((v) => `${v.regNo} ${v.name}`.toLowerCase().includes(search.toLowerCase())),
    [vehicles, search]
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }
  function openEdit(v) {
    setEditingId(v.id);
    setForm({ ...v });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        maxLoadKg: Number(form.maxLoadKg),
        odometer: Number(form.odometer),
        acquisitionCost: Number(form.acquisitionCost),
      };
      if (editingId) await updateVehicle(editingId, payload);
      else await createVehicle(payload);
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this vehicle from the registry?')) return;
    await deleteVehicle(id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reg no. or name…" className="pl-8" />
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus size={16} /> Register Vehicle
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Reg No.</th>
              <th className="px-4 py-3">Name / Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Max Load</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((v) => (
              <tr key={v.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{v.regNo}</td>
                <td className="px-4 py-3">{v.name}</td>
                <td className="px-4 py-3">{v.type}</td>
                <td className="px-4 py-3">{v.maxLoadKg} kg</td>
                <td className="px-4 py-3 font-mono text-xs">{v.odometer?.toLocaleString()} km</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">{v.region}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(v)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[var(--color-ink)]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-[var(--color-danger)]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading vehicles…</p>}
        {!loading && filtered.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No vehicles match your search.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Vehicle' : 'Register Vehicle'}>
        <form onSubmit={handleSubmit}>
          {error && <div className="mb-3"><Alert variant="error">{error}</Alert></div>}
          <Field label="Registration Number" required>
            <Input required value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} placeholder="UP32-AB-1042" />
          </Field>
          <Field label="Vehicle Name / Model" required>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" required>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['Van', 'Truck', 'Pickup', 'Mini Truck'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Region" required>
              <Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                {['North', 'South', 'East', 'West'].map((r) => <option key={r}>{r}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Load Capacity (kg)" required>
              <Input type="number" min="0" required value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: e.target.value })} />
            </Field>
            <Field label="Odometer (km)" required>
              <Input type="number" min="0" required value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Acquisition Cost (₹)" required>
              <Input type="number" min="0" required value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </Field>
            <Field label="Status" required>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">{editingId ? 'Save Changes' : 'Register Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
