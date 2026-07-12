import { useEffect, useState } from 'react';
import { Menu, LogOut, Wifi, WifiOff, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { connectionEvents, getConnectionMode } from '../../services/dataService';

const ROLE_COLORS = {
  'Admin': 'bg-purple-100 text-purple-700',
  'Fleet Manager': 'bg-blue-100 text-blue-700',
  'Driver': 'bg-green-100 text-green-700',
  'Safety Officer': 'bg-orange-100 text-orange-700',
  'Financial Analyst': 'bg-teal-100 text-teal-700',
};

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState(getConnectionMode());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setMode(e.detail);
      setPulse(true);
      setTimeout(() => setPulse(false), 1500);
    };
    connectionEvents.addEventListener('change', handler);
    return () => connectionEvents.removeEventListener('change', handler);
  }, []);

  const roleColor = ROLE_COLORS[user?.role] || 'bg-slate-100 text-slate-600';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-card)]/95 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 hover:bg-[var(--color-surface-muted)] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Live Connection Status Banner */}
        {mode !== 'unknown' && (
          <span
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:flex transition-all duration-300 ${
              mode === 'live'
                ? 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]'
                : 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
            } ${pulse ? 'scale-105' : 'scale-100'}`}
            title={
              mode === 'live'
                ? 'Connected to live backend API'
                : 'Backend unavailable — running on offline mock data'
            }
          >
            {mode === 'live' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-success)]"></span>
                </span>
                <Wifi size={12} />
                LIVE API
              </>
            ) : (
              <>
                <WifiOff size={12} />
                <Database size={12} />
                MOCK DATA
              </>
            )}
          </span>
        )}

        {/* Role badge */}
        {user?.role && (
          <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block ${roleColor}`}>
            {user.role}
          </span>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)]"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}