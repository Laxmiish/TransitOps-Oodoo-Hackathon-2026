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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  // Fleet-wide fuel efficiency (total distance / total fuel across all completed trips)
  const avgFuelEfficiency = useMemo(() => {
    const totalDistance = report.reduce((s, r) => s + r.totalDistance, 0);
    const totalFuel = report.reduce((s, r) => s + r.totalFuelFromTrips, 0);
    return totalFuel > 0 ? Number((totalDistance / totalFuel).toFixed(1)) : 0;
  }, [report]);

  const totalOperationalCost = useMemo(
    () => report.reduce((s, r) => s + r.operationalCost, 0),
    [report]
  );

  const avgRoi = useMemo(() => {
    if (!report.length) return 0;
    return Number((report.reduce((s, r) => s + r.roi, 0) / report.length).toFixed(1));
  }, [report]);

  // Revenue grouped by month, from completed trips with a date field
  const monthlyRevenue = useMemo(() => {
    const buckets = {};
    trips.filter((t) => t.status === 'Completed' && t.date).forEach((t) => {
      const monthIdx = new Date(t.date).getMonth();
      const label = MONTH_LABELS[monthIdx];
      buckets[label] = (buckets[label] || 0) + (t.revenue || 0);
    });
    return MONTH_LABELS.filter((m) => buckets[m] !== undefined).map((m) => ({ month: m, revenue: buckets[m] }));
  }, [trips]);

  // Top 3 costliest vehicles by operational cost
  const topCostliest = useMemo(() => {
    const sorted = [...report].sort((a, b) => b.operationalCost - a.operationalCost).slice(0, 3);
    const max = sorted[0]?.operationalCost || 1;
    const colors = ['bg-rose-400', 'bg-orange-400', 'bg-sky-400'];
    return sorted.map((r, i) => ({ ...r, pct: Math.round((r.operationalCost / max) * 100), color: colors[i] || 'bg-slate-400' }));
  }, [report]);

  function handleExport() {
    const headers = ['regNo', 'name', 'totalDistance', 'totalFuelFromTrips', 'fuelEfficiency', 'operationalCost', 'revenue', 'roi'];
    downloadCsv('transitops_reports.csv', toCsv(report, headers));
  }

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Crunching numbers…</p>;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Fuel Efficiency</p>
          <p className="font-display text-2xl font-semibold">{avgFuelEfficiency} km/l</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Fleet Utilization</p>
          <p className="font-display text-2xl font-semibold">{fleetUtilization}%</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Operational Cost</p>
          <p className="font-display text-2xl font-semibold">₹{totalOperationalCost.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Vehicle ROI</p>
          <p className={`font-display text-2xl font-semibold ${avgRoi >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{avgRoi}%</p>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
      </p>

      <div className="flex justify-end">
        <Button variant="accent" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Monthly Revenue + Top Costliest Vehicles */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="mb-3 font-display text-sm font-semibold">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EF" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6C9BEF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {monthlyRevenue.length === 0 && <p className="text-center text-xs text-[var(--color-text-muted)]">No dated trip revenue yet.</p>}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <p className="mb-4 font-display text-sm font-semibold">Top Costliest Vehicles</p>
          <div className="space-y-4">
            {topCostliest.map((r) => (
              <div key={r.regNo}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-mono font-medium">{r.regNo}</span>
                  <span className="text-[var(--color-text-muted)]">₹{r.operationalCost.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
            {topCostliest.length === 0 && <p className="text-xs text-[var(--color-text-muted)]">No cost data yet.</p>}
          </div>
        </div>
      </div>

      {/* Detailed per-vehicle table */}
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