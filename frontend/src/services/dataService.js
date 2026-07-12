import api from './api';
import * as mock from './mockService';

// Tiny event bus so the UI can show a "using offline data" indicator
// without prop-drilling connection state everywhere.
export const connectionEvents = new EventTarget();
let mode = 'unknown'; // 'live' | 'mock' | 'unknown'

function setMode(next) {
  if (mode !== next) {
    mode = next;
    connectionEvents.dispatchEvent(new CustomEvent('change', { detail: mode }));
  }
}
export function getConnectionMode() {
  return mode;
}

async function withFallback(apiCall, mockCall) {
  try {
    const result = await apiCall();
    setMode('live');
    return result;
  } catch (err) {
    // Network error / timeout / backend not implemented yet -> use mock.
    // A real validation error from a *reachable* backend (4xx with response)
    // should still surface to the user rather than silently falling back.
    const isReachableButRejected = err?.response && err.response.status < 500;
    if (isReachableButRejected) {
      setMode('live');
      throw new Error(err.response.data?.message || 'Request was rejected by the server.');
    }
    setMode('mock');
    return mockCall();
  }
}

// ---------- Auth ----------
export const login = (email, password) =>
  withFallback(
    async () => (await api.post('/auth/login', { email, password })).data,
    () => mock.mockLogin(email, password)
  );

// ---------- Vehicles ----------
export const getVehicles = () =>
  withFallback(async () => (await api.get('/vehicles')).data, mock.mockGetVehicles);
export const createVehicle = (data) =>
  withFallback(async () => (await api.post('/vehicles', data)).data, () => mock.mockCreateVehicle(data));
export const updateVehicle = (id, data) =>
  withFallback(async () => (await api.patch(`/vehicles/${id}`, data)).data, () => mock.mockUpdateVehicle(id, data));
export const deleteVehicle = (id) =>
  withFallback(async () => (await api.delete(`/vehicles/${id}`)).data, () => mock.mockDeleteVehicle(id));

// ---------- Drivers ----------
export const getDrivers = () =>
  withFallback(async () => (await api.get('/drivers')).data, mock.mockGetDrivers);
export const createDriver = (data) =>
  withFallback(async () => (await api.post('/drivers', data)).data, () => mock.mockCreateDriver(data));
export const updateDriver = (id, data) =>
  withFallback(async () => (await api.patch(`/drivers/${id}`, data)).data, () => mock.mockUpdateDriver(id, data));
export const deleteDriver = (id) =>
  withFallback(async () => (await api.delete(`/drivers/${id}`)).data, () => mock.mockDeleteDriver(id));

// ---------- Trips ----------
export const getTrips = () =>
  withFallback(async () => (await api.get('/trips')).data, mock.mockGetTrips);
export const createTrip = (data) =>
  withFallback(async () => (await api.post('/trips', data)).data, () => mock.mockCreateTrip(data));
export const dispatchTrip = (id) =>
  withFallback(async () => (await api.post(`/trips/${id}/dispatch`)).data, () => mock.mockDispatchTrip(id));
export const completeTrip = (id, data) =>
  withFallback(async () => (await api.post(`/trips/${id}/complete`, data)).data, () => mock.mockCompleteTrip(id, data));
export const cancelTrip = (id) =>
  withFallback(async () => (await api.post(`/trips/${id}/cancel`)).data, () => mock.mockCancelTrip(id));

// ---------- Maintenance ----------
export const getMaintenance = () =>
  withFallback(async () => (await api.get('/maintenance')).data, mock.mockGetMaintenance);
export const createMaintenance = (data) =>
  withFallback(async () => (await api.post('/maintenance', data)).data, () => mock.mockCreateMaintenance(data));
export const closeMaintenance = (id) =>
  withFallback(async () => (await api.post(`/maintenance/${id}/close`)).data, () => mock.mockCloseMaintenance(id));

// ---------- Fuel logs ----------
export const getFuelLogs = () =>
  withFallback(async () => (await api.get('/fuel-logs')).data, mock.mockGetFuelLogs);
export const createFuelLog = (data) =>
  withFallback(async () => (await api.post('/fuel-logs', data)).data, () => mock.mockCreateFuelLog(data));

// ---------- Expenses ----------
export const getExpenses = () =>
  withFallback(async () => (await api.get('/expenses')).data, mock.mockGetExpenses);
export const createExpense = (data) =>
  withFallback(async () => (await api.post('/expenses', data)).data, () => mock.mockCreateExpense(data));
