import { useEffect, useState } from 'react';
import { Menu, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { connectionEvents, getConnectionMode } from '../../services/dataService';

export default function Topbar({ title, onMenuClick }) {
  const { logout } = useAuth();
  const [mode, setMode] = useState(getConnectionMode());

  useEffect(() => {
    const handler = (e) => setMode(e.detail);
    connectionEvents.addEventListener('change', handler);
    return () => connectionEvents.removeEventListener('change', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-card)]/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded-lg p-1.5 hover:bg-[var(--color-surface-muted)] lg:hidden">
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {mode !== 'unknown' && (
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:flex ${
              mode === 'live'
                ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
            }`}
            title={
              mode === 'live'
                ? 'Connected to backend API'
                : 'Backend is not reachable — showing mock data'
            }
          >
            {mode === 'live' ? <Wifi size={13} /> : <WifiOff size={13} />}
            {mode === 'live' ? 'Live backend' : 'Backend not reachable'}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}