import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Waypoints, Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'vehicles', to: '/vehicles', label: 'Vehicle Registry', icon: Truck },
  { key: 'drivers', to: '/drivers', label: 'Drivers', icon: Users },
  { key: 'trips', to: '/trips', label: 'Trips', icon: Route },
  { key: 'maintenance', to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { key: 'fuel', to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { key: 'reports', to: '/reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, can } = useAuth();
  const items = NAV_ITEMS.filter((item) => can(item.key));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col bg-[var(--color-ink)] transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)]">
            <Waypoints size={18} className="text-[var(--color-ink)]" strokeWidth={2.4} />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-white leading-none">TransitOps</p>
            <p className="text-[11px] text-[var(--color-text-onink)] mt-0.5">Fleet Command Center</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {items.map(({ key, to, label, icon: Icon }) => (
            <NavLink
              key={key}
              to={to}
              end={to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-ink-3)] text-white'
                    : 'text-[var(--color-text-onink)] hover:bg-[var(--color-ink-2)] hover:text-white'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--color-ink-3)] px-5 py-4">
          <p className="text-xs text-[var(--color-text-onink)]">Signed in as</p>
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-[var(--color-accent)]">{user?.role}</p>
        </div>
      </aside>
    </>
  );
}