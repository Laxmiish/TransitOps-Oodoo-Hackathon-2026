import { useEffect, useMemo, useState } from 'react';
import { Truck, CheckCircle2, Wrench, Route, Users, Gauge, PackageSearch } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getVehicles, getDrivers, getTrips } from '../services/dataService';
import KPICard from '../components/common/KPICard';
import { Select } from '../components/common/Field';
import StatusBadge from '../components/common/StatusBadge';

const PIE_COLORS = ['#178A4C', '#2E6FE0', '#E0952E', '#94A3B8'];

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    (async () => {
      const [v, d, t] = await Promise.all([getVehicles(), getDrivers(), getTrips()]);
      setVehicles(v);
      setDrivers(d);
      setTrips(t);
      setLoading(false);
    })();
  }, []);

  const vehicleTypes = useMemo(() => ['All', ...new Set(vehicles.map((v) => v.type))], [vehicles]);
  const regions = useMemo(() => ['All', ...new Set(vehicles.map((v) => v.region))], [vehicles]);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          (typeFilter === 'All' || v.type === typeFilter) &&
          (statusFilter === 'All' || v.status === statusFilter) &&
          (regionFilter === 'All' || v.region === regionFilter)
      ),
    [vehicles, typeFilter, statusFilter, regionFilter]
  );

  const kpis = useMemo(() => {
    const activeVehicles = filteredVehicles.filter((v) => v.status !== 'Retired');
    const available = filteredVehicles.filter((v) => v.status === 'Available');
    const inMaintenance = filteredVehicles.filter((v) => v.status === 'In Shop');
    const onTrip = filteredVehicles.filter((v) => v.status === 'On Trip');
    const activeTrips = trips.filter((t) => t.status === 'Dispatched');
    const pendingTrips = trips.filter((t) => t.status === 'Draft');
    const driversOnDuty = drivers.filter((d) => d.status === 'On Trip');
    const utilization = activeVehicles.length ? Math.round((onTrip.length / activeVehicles.length) * 100) : 0;
    return { activeVehicles, available, inMaintenance, onTrip, activeTrips, pendingTrips, driversOnDuty, utilization };
  }, [filteredVehicles, trips, drivers]);

  const statusPieData = useMemo(() => {
    const counts = {};
    filteredVehicles.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredVehicles]);

  const board = useMemo(() => {
    return trips
      .filter((t) => t.status === 'Dispatched' || t.status === 'Draft')
      .map((t) => ({
        ...t,
        vehicleReg: vehicles.find((v) => v.id === t.vehicleId)?.regNo || '—',
        driverName: drivers.find((d) => d.id === t.driverId)?.name || '—',
      }));
  }, [trips, vehicles, drivers]);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">Filter:</span>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-auto">
          {vehicleTypes.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          {['All', 'Available', 'On Trip', 'In Shop', 'Retired'].map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </Select>
        <Select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-auto">
          {regions.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <KPICard label="Active Vehicles" value={kpis.activeVehicles.length} icon={Truck} accent="accent" />
        <KPICard label="Available Vehicles" value={kpis.available.length} icon={CheckCircle2} accent="success" />
        <KPICard label="In Maintenance" value={kpis.inMaintenance.length} icon={Wrench} accent="danger" />
        <KPICard label="Active Trips" value={kpis.activeTrips.length} icon={Route} accent="info" />
        <KPICard label="Pending Trips" value={kpis.pendingTrips.length} icon={PackageSearch} accent="accent" />
        <KPICard label="Drivers On Duty" value={kpis.driversOnDuty.length} icon={Users} accent="transit" />
        <KPICard label="Fleet Utilization" value={kpis.utilization} suffix="%" icon={Gauge} accent="transit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Dispatch board (signature element) */}
        <div className="board-panel rounded-2xl p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-widest text-[var(--color-text-onink)]">
            <span>DISPATCH BOARD · DRAFT &amp; ACTIVE</span>
            <span className="board-flicker text-[var(--color-accent)]">● LIVE</span>
          </div>
          {board.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-text-onink)]">No active or pending trips.</p>}
          <div className="max-h-80 overflow-y-auto">
            {board.map((t) => (
              <div key={t.id} className="board-row grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 font-mono text-xs">
                <span className="truncate text-white">{t.source.toUpperCase()} → {t.destination.toUpperCase()}</span>
                <span className="text-[var(--color-text-onink)]">{t.vehicleReg}</span>
                <span className={t.status === 'Dispatched' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-onink)]'}>
                  {t.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle status breakdown */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 lg:col-span-2">
          <p className="mb-2 font-display text-sm font-semibold text-[var(--color-text-primary)]">Vehicle Status Mix</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicles table snapshot */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <p className="mb-3 font-display text-sm font-semibold text-[var(--color-text-primary)]">Filtered Vehicles ({filteredVehicles.length})</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="py-2 pr-4">Reg No.</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Region</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{v.regNo}</td>
                  <td className="py-2 pr-4">{v.name}</td>
                  <td className="py-2 pr-4">{v.type}</td>
                  <td className="py-2 pr-4">{v.region}</td>
                  <td className="py-2 pr-4"><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
