import { useEffect, useMemo, useState } from 'react';
import { Fuel as FuelIcon, Receipt } from 'lucide-react';
import {
  getVehicles, getFuelLogs, getExpenses, getMaintenance, createFuelLog, createExpense,
} from '../services/dataService';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { Field, Input, Select, Button } from '../components/common/Field';

const EMPTY_FUEL = { vehicleId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) };
const EMPTY_EXPENSE = { vehicleId: '', category: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10) };

export default function FuelExpenses() {
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL);
  const [fuelError, setFuelError] = useState('');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [expenseError, setExpenseError] = useState('');

  async function refresh() {
    setLoading(true);
    const [v, f, e, m] = await Promise.all([getVehicles(), getFuelLogs(), getExpenses(), getMaintenance()]);
    setVehicles(v); setFuelLogs(f); setExpenses(e); setMaintenance(m);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const vehicleReg = (id) => vehicles.find((v) => v.id === id)?.regNo || '—';

  const totalOperationalCost = useMemo(() => {
    const fuelTotal = fuelLogs.reduce((s, f) => s + Number(f.cost), 0);
    const maintTotal = maintenance.reduce((s, m) => s + Number(m.cost), 0);
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
    return fuelTotal + maintTotal + expenseTotal;
  }, [fuelLogs, maintenance, expenses]);

  async function handleFuelSubmit(e) {
    e.preventDefault();
    setFuelError('');
    try {
      await createFuelLog({ ...fuelForm, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) });
      setFuelModalOpen(false);
      refresh();
    } catch (err) {
      setFuelError(err.message);
    }
  }

  async function handleExpenseSubmit(e) {
    e.preventDefault();
    setExpenseError('');
    try {
      await createExpense({ ...expenseForm, amount: Number(expenseForm.amount) });
      setExpenseModalOpen(false);
      refresh();
    } catch (err) {
      setExpenseError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Fuel Logs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Fuel Logs
          </h2>
          <div className="flex gap-2">
            <Button variant="accent" onClick={() => { setFuelForm(EMPTY_FUEL); setFuelError(''); setFuelModalOpen(true); }}>
              <FuelIcon size={16} /> Log Fuel
            </Button>
            <Button variant="accent" onClick={() => { setExpenseForm(EMPTY_EXPENSE); setExpenseError(''); setExpenseModalOpen(true); }}>
              <Receipt size={16} /> Add Expense
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {!loading && fuelLogs.slice().reverse().map((f) => (
                <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{vehicleReg(f.vehicleId)}</td>
                  <td className="px-4 py-3">{f.date}</td>
                  <td className="px-4 py-3">{f.liters} L</td>
                  <td className="px-4 py-3">₹{Number(f.cost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading fuel logs…</p>}
          {!loading && fuelLogs.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No fuel logs yet.</p>}
        </div>
      </div>

      {/* Other Expenses */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Other Expenses (Toll / Misc)
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {!loading && expenses.slice().reverse().map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{vehicleReg(e.vehicleId)}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">₹{Number(e.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">Loading expenses…</p>}
          {!loading && expenses.length === 0 && <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No expenses yet.</p>}
        </div>
      </div>

      {/* Total operational cost */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Total Operational Cost (Auto) = Fuel + Maint + Other
        </span>
        <span className="font-display text-lg font-semibold text-[var(--color-accent)]">
          ₹{totalOperationalCost.toLocaleString()}
        </span>
      </div>

      {/* Log Fuel modal */}
      <Modal open={fuelModalOpen} onClose={() => setFuelModalOpen(false)} title="Log Fuel">
        <form onSubmit={handleFuelSubmit}>
          {fuelError && <div className="mb-3"><Alert variant="error">{fuelError}</Alert></div>}
          <Field label="Vehicle" required>
            <Select required value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Liters" required>
              <Input type="number" min="0" step="0.1" required value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
            </Field>
            <Field label="Cost (₹)" required>
              <Input type="number" min="0" required value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
            </Field>
          </div>
          <Field label="Date" required>
            <Input type="date" required value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFuelModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">Save Fuel Log</Button>
          </div>
        </form>
      </Modal>

      {/* Log Expense modal */}
      <Modal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Log Expense">
        <form onSubmit={handleExpenseSubmit}>
          {expenseError && <div className="mb-3"><Alert variant="error">{expenseError}</Alert></div>}
          <Field label="Vehicle" required>
            <Select required value={expenseForm.vehicleId} onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
              <option value="">Select a vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo} — {v.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <Select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                {['Toll', 'Parking', 'Fine', 'Permit', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Amount (₹)" required>
              <Input type="number" min="0" required value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            </Field>
          </div>
          <Field label="Date" required>
            <Input type="date" required value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="accent">Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}