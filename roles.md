# TransitOps Demo Credentials

The backend seed script (`backend/seed.py`) generated the following demo accounts mapped to their respective roles in the PostgreSQL database.

All accounts use the same default password:
**Password:** `password123`

## 1. Fleet Manager
*   **Name:** Alice Fleet
*   **Email:** `alice@transitops.com`
*   **Permissions:** Full access to Vehicles, Drivers, Trips, Maintenance, and Analytics. Cannot manage Users or Roles.

## 2. Driver
*   **Name:** Bob Driver
*   **Email:** `bob@transitops.com`
*   **Permissions:** Can create and update Trips (status transitions). Denied access to Expenses, Analytics, and Vehicle creation.

## 3. Safety Officer
*   **Name:** Charlie Safety
*   **Email:** `charlie@transitops.com`
*   **Permissions:** Can create and manage Driver profiles. Denied access to Financial Analytics.

## 4. Financial Analyst
*   **Name:** Diana Finance
*   **Email:** `diana@transitops.com`
*   **Permissions:** Can view Dashboard KPIs, Reports Analytics, and Expenses. Denied access to dispatching Trips or Maintenance.

## 5. Admin (Superuser)
*   **Name:** Admin User
*   **Email:** `admin@transitops.com`
*   **Permissions:** Full access to all endpoints, including User and Role creation.

> [!TIP]
> To test the RBAC (Role-Based Access Control) in the frontend, simply click the "Logout" button on the sidebar and sign back in using one of the emails above to see how the API restricts certain actions.
