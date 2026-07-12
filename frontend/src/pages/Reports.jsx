import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getVehicles, getTrips, getFuelLogs, getMaintenance } from '../services/dataService';
import { Button } from '../components/common/Field';

function toCsv(rows, headers) {
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  return lines.join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [v, t, f, m] = await Promise.all([getVehicles(), getTrips(), getFuelLogs(), getMaintenance()]);
      setVehicles(v); setTrips(t); setFuelLogs(f); setMaintenance(m);
      setLoading(false);
    })();
  }, []);

  const report = useMemo(() => {
    return vehicles.map((v) => {
      const completedTrips = trips.filter((t) => t.vehicleId === v.id && t.status === 'Completed');
      const totalDistance = completedTrips.reduce((s, t) => s + (t.plannedDistanceKm || 0), 0);
      const totalFuelFromTrips = completedTrips.reduce((s, t) => s + (t.fuelConsumedL || 0), 0);
      const fuelCost = fuelLogs.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
      const maintCost = maintenance.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
      const revenue = completedTrips.reduce((s, t) => s + (t.revenue || 0), 0);
      const fuelEfficiency = totalFuelFromTrips > 0 ? totalDistance / totalFuelFromTrips : 0;
      const operationalCost = fuelCost + maintCost;
      const roi = v.acquisitionCost > 0 ? (revenue - operationalCost) / v.acquisitionCost : 0;
      return {
        regNo: v.regNo,
        name: v.name,
        totalDistance,
        totalFuelFromTrips,
        fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
        operationalCost,
        revenue,
        roi: Number((roi * 100).toFixed(1)),
      };
    });
  }, [vehicles, trips, fuelLogs, maintenance]);

  const fleetUtilization = useMemo(() => {
    const active = vehicles.filter((v) => v.status !== 'Retired');
    const onTrip = vehicles.filter((v) => v.status === 'On Trip');
    return active.length ? Math.round((onTrip.length / active.length) * 100) : 0;
  }, [vehicles]);

  function handleExport() {
    const headers = ['regNo', 'name', 'totalDistance', 'totalFuelFromTrips', 'fuelEfficiency', 'operationalCost', 'revenue', 'roi'];
    downloadCsv('transitops_reports.csv', toCsv(report, headers));
  }

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Crunching numbers…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Fleet Utilization</p>
          <p className="font-display text-2xl font-semibold">{fleetUtilization}%</p>
        </div>
        <Button variant="accent" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <p className="mb-3 font-display text-sm font-semibold">Vehicle ROI (%)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={report}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EF" />
            <XAxis dataKey="regNo" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="roi" fill="#F2A93B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Distance (km)</th>
              <th className="px-4 py-3">Fuel Used (L)</th>
              <th className="px-4 py-3">Fuel Efficiency (km/L)</th>
              <th className="px-4 py-3">Operational Cost</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.regNo} className="border-b border-[var(--color-border)] last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{r.regNo}</td>
                <td className="px-4 py-3">{r.totalDistance}</td>
                <td className="px-4 py-3">{r.totalFuelFromTrips}</td>
                <td className="px-4 py-3">{r.fuelEfficiency || '—'}</td>
                <td className="px-4 py-3">₹{r.operationalCost.toLocaleString()}</td>
                <td className="px-4 py-3">₹{r.revenue.toLocaleString()}</td>
                <td className={`px-4 py-3 font-medium ${r.roi >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{r.roi}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
