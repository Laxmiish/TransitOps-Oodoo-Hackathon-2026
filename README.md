# TransitOps — Smart Transport Operations Platform

React + Vite + Tailwind CSS (v4) implementation of the TransitOps hackathon brief.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. Demo accounts (password: `password123`) are shown
on the login screen for all four roles (Fleet Manager, Driver, Safety Officer,
Financial Analyst).

## Connecting your own backend

Set your API root in `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

The app calls your backend first. If any request fails to reach the backend
(network error, timeout, backend not started), it automatically falls back
to a local mock data store (persisted in `localStorage`) so the UI always
works — useful for demoing before the backend is fully wired up. A badge in
the top bar shows whether you're on **Live backend** or **Offline mock data**.

If your backend is reachable but rejects a request (validation error, 4xx
response), that error is shown to the user as-is — it does not silently
fall back to mock data.

### Expected REST endpoints

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login` -> `{ user, token }` |
| Vehicles | `GET/POST /vehicles`, `PATCH/DELETE /vehicles/:id` |
| Drivers | `GET/POST /drivers`, `PATCH/DELETE /drivers/:id` |
| Trips | `GET/POST /trips`, `POST /trips/:id/dispatch`, `POST /trips/:id/complete`, `POST /trips/:id/cancel` |
| Maintenance | `GET/POST /maintenance`, `POST /maintenance/:id/close` |
| Fuel logs | `GET/POST /fuel-logs` |
| Expenses | `GET/POST /expenses` |

Adjust `src/services/dataService.js` if your backend's routes differ.

## Business rules implemented

All rules from Section 4 of the brief are enforced in
`src/services/businessRules.js`, including:

- Unique registration numbers
- Retired / In Shop vehicles excluded from dispatch
- Expired-license or Suspended drivers excluded from assignment
- Vehicles/drivers already On Trip excluded from re-assignment
- Cargo weight <= vehicle max load capacity
- Automatic status transitions on dispatch / complete / cancel
- Maintenance creation -> vehicle "In Shop"; closing -> "Available" (unless Retired)

## Structure

```
src/
  context/AuthContext.jsx      # login/logout + RBAC permission checks
  services/
    api.js                    # axios instance (your backend)
    dataService.js            # tries backend, falls back to mock
    mockService.js            # mock CRUD + business-rule enforcement
    localStore.js             # localStorage-backed mock DB
    mockData.js               # seed data
    businessRules.js          # shared validators
  components/
    layout/                   # Sidebar, Topbar, AppLayout, ProtectedRoute
    common/                   # StatusBadge, KPICard, Modal, Field, Alert
  pages/
    Login, Dashboard, Vehicles, Drivers, Trips, Maintenance,
    FuelExpenses, Reports
```

## Not yet implemented (bonus features from the brief)

PDF export, email reminders for expiring licenses, document management,
dark mode. CSV export, search/filter/sort, and all mandatory deliverables
are implemented.

## Bonus Features aside the mentioned in the brief
- PDF Export