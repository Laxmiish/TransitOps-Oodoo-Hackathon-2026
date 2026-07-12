import { createContext, useContext, useEffect, useState } from 'react';
import { login as loginRequest } from '../services/dataService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'transitops_session';

export const ROLES = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

// Which nav sections each role can see. Fleet Manager sees everything,
// including Settings (depot config + RBAC). Others get a focused subset
// per the spec's "Target Users" section.
export const ROLE_PERMISSIONS = {
  [ROLES.FLEET_MANAGER]: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'reports', 'settings'],
  [ROLES.DRIVER]: ['dashboard', 'trips'],
  [ROLES.SAFETY_OFFICER]: ['dashboard', 'drivers', 'reports'],
  [ROLES.FINANCIAL_ANALYST]: ['dashboard', 'fuel', 'reports'],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw);
        setUser(session.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { user: loggedInUser, token } = await loginRequest(email, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: loggedInUser }));
    localStorage.setItem('transitops_token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('transitops_token');
    setUser(null);
  }

  function can(section) {
    if (!user) return false;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(section);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}