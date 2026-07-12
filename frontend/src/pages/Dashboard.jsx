import { useEffect, useMemo, useState } from 'react';
import { Truck, CheckCircle2, Wrench, Route, Users, Gauge, PackageSearch } from 'lucide-react';
import { getVehicles, getDrivers, getTrips } from '../services/dataService';
import { Select } from '../components/common/Field';

const KPI_ACCENTS = {
  info: { border: 'border-l-[var(--color-info)]', icon: 'text-[var(--color-info)] bg-[var(--color-info-soft)]' },
  success: { border: 'border-l-[var(--color-success)]', icon: 'text-[var(--color-success)] bg-[var(--color-success-soft)]' },
  warning: { border: 'border-l-[var(--color-warning)]', icon: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
  muted: { border: 'border-l-[var(--color-text-muted)]', icon: 'text-[var(--color-text-muted)] bg-[var(--color-surface-muted)]' },
};

function KPI({ label, value, suffix = '', icon: Icon, accent = 'info' }) {
  const a = KPI_ACCENTS[accent];
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-[var(--color-border)] border-l-4 ${a.border} bg-[var(--color-surface-card)] px-4 py-3`}>
      {Icon && (
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${a.icon}`}>
          <Icon size={16} strokeWidth={2.2} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
        <p className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
          {value}
          {suffix && <span className="ml-0.5 text-sm font-medium text-[var(--color-text-muted)]">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

const TRIP_PILL = {
  'On Trip': 'bg-[var(--color-info)] text-white',
  Dispatched: 'bg-[var(--color-info)] text-white',
  Completed: 'bg-[var(--color-success)] text-white',
  Draft: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  Cancelled: 'bg-[var(--color-danger)] text-white',
};

function TripPill({ status }) {
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${TRIP_PILL[status] || TRIP_PILL.Draft}`}>
      {status}
    </span>
  );
}

const VEHICLE_STATUS_BARS = [
  { key: 'Available', label: 'Available', color: 'bg-[var(--color-success)]' },
  { key: 'On Trip', label: 'On Trip', color: 'bg-[var(--color-info)]' },
  { key: 'In Shop', label: 'In Shop', color: 'bg-[var(--color-warning)]' },
  { key: 'Retired', label: 'Retired', color: 'bg-[var(--color-danger)]' },
];

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

  const vehicleStatusCounts = useMemo(() => {
    const counts = {};
    filteredVehicles.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
    const max = Math.max(1, ...Object.values(counts));
    return VEHICLE_STATUS_BARS.map((b) => ({
      ...b,
      count: counts[b.key] || 0,
      pct: Math.round(((counts[b.key] || 0) / max) * 100),
    }));
  }, [filteredVehicles]);

  const recentTrips = useMemo(() => {
    return trips
      .slice()
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .slice(0, 6)
      .map((t) => ({
        ...t,
        vehicleReg: vehicles.find((v) => v.id === t.vehicleId)?.regNo || '—',
        driverName: drivers.find((d) => d.id === t.driverId)?.name || '—',
      }));
  }, [trips, vehicles, drivers]);

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Loading dashboard…</p>;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">Filters</span>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-auto">
          {vehicleTypes.map((t) => <option key={t} value={t}>{t === 'All' ? 'Vehicle Type: All' : t}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
          {['All', 'Available', 'On Trip', 'In Shop', 'Retired'].map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'Status: All' : s}</option>
          ))}
        </Select>
        <Select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-auto">
          {regions.map((r) => <option key={r} value={r}>{r === 'All' ? 'Region: All' : r}</option>)}
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
        <KPI label="Active Vehicles" value={kpis.activeVehicles.length} icon={Truck} accent="info" />
        <KPI label="Available Vehicles" value={kpis.available.length} icon={CheckCircle2} accent="success" />
        <KPI label="Vehicles In Maintenance" value={kpis.inMaintenance.length} icon={Wrench} accent="warning" />
        <KPI label="Active Trips" value={kpis.activeTrips.length} icon={Route} accent="info" />
        <KPI label="Pending Trips" value={kpis.pendingTrips.length} icon={PackageSearch} accent="muted" />
        <KPI label="Drivers On Duty" value={kpis.driversOnDuty.length} icon={Users} accent="muted" />
        <KPI label="Fleet Utilization" value={kpis.utilization} suffix="%" icon={Gauge} accent="success" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent trips */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5 lg:col-span-2">
          <p className="mb-3 font-display text-sm font-semibold text-[var(--color-text-primary)]">Recent Trips</p>
          {recentTrips.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No trips yet.</p>
          )}
          {recentTrips.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <th className="py-2 pr-4">Trip</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Driver</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-2.5 pr-4 font-mono text-xs text-[var(--color-text-primary)]">{t.id}</td>
                      <td className="py-2.5 pr-4 text-[var(--color-text-primary)]">{t.vehicleReg}</td>
                      <td className="py-2.5 pr-4 text-[var(--color-text-primary)]">{t.driverName}</td>
                      <td className="py-2.5 pr-4"><TripPill status={t.status} /></td>
                      <td className="py-2.5 pr-4 text-[var(--color-text-muted)]">{t.eta || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vehicle status breakdown */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-5">
          <p className="mb-4 font-display text-sm font-semibold text-[var(--color-text-primary)]">Vehicle Status</p>
          <div className="space-y-3">
            {vehicleStatusCounts.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">{b.label}</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{b.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                  <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}