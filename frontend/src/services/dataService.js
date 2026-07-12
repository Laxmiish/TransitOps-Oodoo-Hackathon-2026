import api from './api';
import * as mock from './mockService';

export const connectionEvents = new EventTarget();
let mode = 'unknown';

function setMode(next) {
  if (mode !== next) {
    mode = next;
    connectionEvents.dispatchEvent(new CustomEvent('change', { detail: mode }));
  }
}
export function getConnectionMode() {
  return mode;
}

// ==========================================
// Data Transformers — snake_case ↔ camelCase
// These normalize the backend snake_case API to the camelCase the UI expects
// ==========================================

export function transformVehicle(v) {
  if (!v) return null;
  return {
    id: v.id,
    regNo: v.registration_number ?? v.regNo,
    name: v.name,
    model: v.model,
    type: v.vehicle_type ?? v.type,
    vehicle_type: v.vehicle_type ?? v.type,
    maxLoadKg: v.max_load_capacity ?? v.maxLoadKg,
    max_load_capacity: v.max_load_capacity ?? v.maxLoadKg,
    odometer: v.odometer ?? 0,
    acquisitionCost: v.acquisition_cost ?? v.acquisitionCost,
    acquisition_cost: v.acquisition_cost ?? v.acquisitionCost,
    status: v.status,
    region: v.region ?? 'North',
  };
}

export function transformDriver(d) {
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    licenseNo: d.license_number ?? d.licenseNo,
    license_number: d.license_number ?? d.licenseNo,
    licenseCategory: d.license_category ?? d.licenseCategory,
    license_category: d.license_category ?? d.licenseCategory,
    licenseExpiry: d.license_expiry_date ?? d.licenseExpiry,
    license_expiry_date: d.license_expiry_date ?? d.licenseExpiry,
    contact: d.contact_number ?? d.contact,
    contact_number: d.contact_number ?? d.contact,
    safetyScore: d.safety_score ?? d.safetyScore ?? 100,
    safety_score: d.safety_score ?? d.safetyScore ?? 100,
    status: d.status,
    tripCompletionRate: d.tripCompletionRate ?? null,
  };
}

export function transformTrip(t) {
  if (!t) return null;
  return {
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicleId: t.vehicle_id ?? t.vehicleId,
    vehicle_id: t.vehicle_id ?? t.vehicleId,
    driverId: t.driver_id ?? t.driverId,
    driver_id: t.driver_id ?? t.driverId,
    cargoWeightKg: t.cargo_weight ?? t.cargoWeightKg,
    cargo_weight: t.cargo_weight ?? t.cargoWeightKg,
    plannedDistanceKm: t.planned_distance ?? t.plannedDistanceKm,
    planned_distance: t.planned_distance ?? t.plannedDistanceKm,
    actualDistanceKm: t.actual_distance ?? t.actualDistanceKm,
    actual_distance: t.actual_distance ?? t.actualDistanceKm,
    fuelConsumedL: t.fuel_consumed ?? t.fuelConsumedL,
    fuel_consumed: t.fuel_consumed ?? t.fuelConsumedL,
    revenue: t.revenue ?? 0,
    status: t.status,
    createdAt: t.created_at ?? t.createdAt,
    date: t.created_at ?? t.createdAt,
  };
}

export function transformMaintenance(m) {
  if (!m) return null;
  return {
    id: m.id,
    vehicleId: m.vehicle_id ?? m.vehicleId,
    vehicle_id: m.vehicle_id ?? m.vehicleId,
    type: m.type ?? (m.description ? m.description.split(':')[0] : ''),
    description: m.description,
    cost: m.cost,
    date: m.log_date ?? m.date,
    log_date: m.log_date ?? m.date,
    status: m.status,
  };
}

export function transformFuelLog(f) {
  if (!f) return null;
  return {
    id: f.id,
    vehicleId: f.vehicle_id ?? f.vehicleId,
    vehicle_id: f.vehicle_id ?? f.vehicleId,
    tripId: f.trip_id ?? f.tripId,
    liters: f.liters,
    cost: f.cost,
    date: f.log_date ?? f.date,
    log_date: f.log_date ?? f.date,
  };
}

export function transformExpense(e) {
  if (!e) return null;
  return {
    id: e.id,
    vehicleId: e.vehicle_id ?? e.vehicleId,
    vehicle_id: e.vehicle_id ?? e.vehicleId,
    category: e.expense_type ?? e.category,
    expense_type: e.expense_type ?? e.category,
    amount: e.cost ?? e.amount,
    cost: e.cost ?? e.amount,
    date: e.expense_date ?? e.date,
    expense_date: e.expense_date ?? e.date,
  };
}

// ==========================================
// Request Payload builders — camelCase → snake_case
// ==========================================

function vehiclePayload(data) {
  return {
    registration_number: data.regNo ?? data.registration_number,
    name: data.name,
    model: data.model ?? data.name,
    vehicle_type: data.type ?? data.vehicle_type,
    max_load_capacity: Number(data.maxLoadKg ?? data.max_load_capacity),
    odometer: Number(data.odometer ?? 0),
    acquisition_cost: Number(data.acquisitionCost ?? data.acquisition_cost),
    status: data.status ?? 'Available',
  };
}

function driverPayload(data) {
  return {
    name: data.name,
    license_number: data.licenseNo ?? data.license_number,
    license_category: data.licenseCategory ?? data.license_category ?? 'LMV',
    license_expiry_date: data.licenseExpiry ?? data.license_expiry_date,
    contact_number: data.contact ?? data.contact_number,
    safety_score: Number(data.safetyScore ?? data.safety_score ?? 100),
    status: data.status ?? 'Available',
  };
}

function tripPayload(data) {
  return {
    source: data.source,
    destination: data.destination,
    vehicle_id: Number(data.vehicleId ?? data.vehicle_id),
    driver_id: Number(data.driverId ?? data.driver_id),
    cargo_weight: Number(data.cargoWeightKg ?? data.cargo_weight),
    planned_distance: Number(data.plannedDistanceKm ?? data.planned_distance ?? 0),
    actual_distance: data.actualDistanceKm ?? data.actual_distance ?? null,
    fuel_consumed: data.fuelConsumedL ?? data.fuel_consumed ?? null,
    revenue: Number(data.revenue ?? 0),
    status: data.status ?? 'Draft',
  };
}

function maintenancePayload(data) {
  // Combine type + description into description for the API
  const descriptionText = data.type
    ? `${data.type}${data.description ? ': ' + data.description : ''}`
    : data.description;
  return {
    vehicle_id: Number(data.vehicleId ?? data.vehicle_id),
    description: descriptionText,
    cost: Number(data.cost),
    log_date: data.date ?? data.log_date,
    status: data.status ?? 'Active',
  };
}

function fuelPayload(data) {
  return {
    vehicle_id: Number(data.vehicleId ?? data.vehicle_id),
    trip_id: data.tripId ?? data.trip_id ?? null,
    liters: Number(data.liters),
    cost: Number(data.cost),
    log_date: data.date ?? data.log_date,
  };
}

function expensePayload(data) {
  return {
    vehicle_id: Number(data.vehicleId ?? data.vehicle_id),
    expense_type: data.category ?? data.expense_type,
    cost: Number(data.amount ?? data.cost),
    expense_date: data.date ?? data.expense_date,
  };
}

// ==========================================
// withFallback — try real API, fall back to mock
// ==========================================
async function withFallback(apiCall, mockCall) {
  try {
    const result = await apiCall();
    setMode('live');
    return result;
  } catch (err) {
    // If we got a real HTTP error (4xx), it's a business rule rejection — don't fall back
    if (err?.response && err.response.status < 500) {
      setMode('live');
      const detail = err.response.data?.detail || err.response.data?.message;
      throw new Error(detail || 'Request rejected by server.');
    }
    // Network error or 5xx — fall back to mock
    setMode('mock');
    return mockCall();
  }
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

// ==========================================
// Auth
// ==========================================
export const login = (email, password) =>
  withFallback(
    async () => {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const res = await api.post('/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const token = res.data.access_token;
      const decoded = parseJwt(token);
      const role = res.data.role || decoded?.role || 'Driver';
      return { token, user: { name: email.split('@')[0], email, role } };
    },
    () => mock.mockLogin(email, password)
  );

export const createUser = (data) =>
  withFallback(
    async () => (await api.post('/users', data)).data,
    () => { throw new Error("Mock user creation not supported"); }
  );

// ==========================================
// Vehicles
// ==========================================
export const getVehicles = () =>
  withFallback(
    async () => (await api.get('/vehicles')).data.map(transformVehicle),
    mock.mockGetVehicles
  );

export const createVehicle = (data) =>
  withFallback(
    async () => transformVehicle((await api.post('/vehicles', vehiclePayload(data))).data),
    () => mock.mockCreateVehicle(data)
  );

export const updateVehicle = (id, data) =>
  withFallback(
    async () => transformVehicle((await api.put(`/vehicles/${id}`, vehiclePayload(data))).data),
    () => mock.mockUpdateVehicle(id, data)
  );

export const updateVehicleStatus = (id, status) =>
  withFallback(
    async () => transformVehicle((await api.patch(`/vehicles/${id}/status`, { status })).data),
    () => mock.mockUpdateVehicle(id, { status })
  );

export const deleteVehicle = (id) =>
  withFallback(
    async () => { await api.delete(`/vehicles/${id}`); return { id }; },
    () => mock.mockDeleteVehicle(id)
  );

// ==========================================
// Drivers
// ==========================================
export const getDrivers = () =>
  withFallback(
    async () => (await api.get('/drivers')).data.map(transformDriver),
    mock.mockGetDrivers
  );

export const createDriver = (data) =>
  withFallback(
    async () => transformDriver((await api.post('/drivers', driverPayload(data))).data),
    () => mock.mockCreateDriver(data)
  );

export const updateDriver = (id, data) =>
  withFallback(
    async () => transformDriver((await api.put(`/drivers/${id}`, driverPayload(data))).data),
    () => mock.mockUpdateDriver(id, data)
  );

export const updateDriverStatus = (id, status) =>
  withFallback(
    async () => transformDriver((await api.patch(`/drivers/${id}/status`, { status })).data),
    () => mock.mockUpdateDriverStatus(id, status)
  );

export const deleteDriver = (id) =>
  withFallback(
    async () => { await api.delete(`/drivers/${id}`); return { id }; },
    () => mock.mockDeleteDriver(id)
  );

// ==========================================
// Trips
// ==========================================
export const getTrips = () =>
  withFallback(
    async () => (await api.get('/trips')).data.map(transformTrip),
    mock.mockGetTrips
  );

export const createTrip = (data) =>
  withFallback(
    async () => transformTrip((await api.post('/trips', tripPayload(data))).data),
    () => mock.mockCreateTrip(data)
  );

export const dispatchTrip = (id) =>
  withFallback(
    async () => transformTrip((await api.patch(`/trips/${id}/status`, { status: 'Dispatched' })).data),
    () => mock.mockDispatchTrip(id)
  );

export const completeTrip = (id, data) =>
  withFallback(
    async () => transformTrip((await api.patch(`/trips/${id}/status`, {
      status: 'Completed',
      actual_distance: data.actualDistanceKm ? Number(data.actualDistanceKm) : null,
      fuel_consumed: data.fuelConsumedL ? Number(data.fuelConsumedL) : null,
      revenue: data.revenue ? Number(data.revenue) : null,
    })).data),
    () => mock.mockCompleteTrip(id, data)
  );

export const cancelTrip = (id) =>
  withFallback(
    async () => transformTrip((await api.patch(`/trips/${id}/status`, { status: 'Cancelled' })).data),
    () => mock.mockCancelTrip(id)
  );

// ==========================================
// Maintenance
// ==========================================
export const getMaintenance = () =>
  withFallback(
    async () => (await api.get('/maintenance')).data.map(transformMaintenance),
    mock.mockGetMaintenance
  );

export const createMaintenance = (data) =>
  withFallback(
    async () => transformMaintenance((await api.post('/maintenance', maintenancePayload(data))).data),
    () => mock.mockCreateMaintenance(data)
  );

export const closeMaintenance = (id) =>
  withFallback(
    async () => transformMaintenance((await api.patch(`/maintenance/${id}/status`, { status: 'Closed' })).data),
    () => mock.mockCloseMaintenance(id)
  );

// ==========================================
// Fuel Logs
// ==========================================
export const getFuelLogs = () =>
  withFallback(
    async () => (await api.get('/fuel')).data.map(transformFuelLog),
    mock.mockGetFuelLogs
  );

export const createFuelLog = (data) =>
  withFallback(
    async () => transformFuelLog((await api.post('/fuel', fuelPayload(data))).data),
    () => mock.mockCreateFuelLog(data)
  );

// ==========================================
// Expenses
// ==========================================
export const getExpenses = () =>
  withFallback(
    async () => (await api.get('/expenses')).data.map(transformExpense),
    mock.mockGetExpenses
  );

export const createExpense = (data) =>
  withFallback(
    async () => transformExpense((await api.post('/expenses', expensePayload(data))).data),
    () => mock.mockCreateExpense(data)
  );