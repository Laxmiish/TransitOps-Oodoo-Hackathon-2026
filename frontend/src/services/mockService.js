import { collection, upsert, patch, remove, nextId } from './localStore';
import { validateTripCreation, isVehicleAssignable, isDriverAssignable } from './businessRules';

function delay(ms = 150) {
  return new Promise((res) => setTimeout(res, ms));
}

// ---------- Auth ----------
export async function mockLogin(email, password) {
  await delay();
  const users = collection('users');
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.code = 'AUTH_FAILED';
    throw err;
  }
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token: `mock-token-${user.id}` };
}

// ---------- Vehicles ----------
export async function mockGetVehicles() {
  await delay();
  return collection('vehicles');
}
export async function mockCreateVehicle(data) {
  await delay();
  const vehicles = collection('vehicles');
  if (vehicles.some((v) => v.regNo.toLowerCase() === data.regNo.toLowerCase())) {
    throw new Error('Registration number must be unique.');
  }
  const record = { id: nextId('v'), status: 'Available', odometer: 0, ...data };
  return upsert('vehicles', record);
}
export async function mockUpdateVehicle(id, data) {
  await delay();
  return patch('vehicles', id, data);
}
export async function mockDeleteVehicle(id) {
  await delay();
  remove('vehicles', id);
  return { id };
}

// ---------- Drivers ----------
export async function mockGetDrivers() {
  await delay();
  return collection('drivers');
}
export async function mockCreateDriver(data) {
  await delay();
  const record = { id: nextId('d'), status: 'Available', safetyScore: 100, ...data };
  return upsert('drivers', record);
}
export async function mockUpdateDriver(id, data) {
  await delay();
  return patch('drivers', id, data);
}
export async function mockUpdateDriverStatus(id, status) {
  await delay();
  return patch('drivers', id, { status });
}
export async function mockDeleteDriver(id) {
  await delay();
  remove('drivers', id);
  return { id };
}

// ---------- Trips ----------
export async function mockGetTrips() {
  await delay();
  return collection('trips');
}

export async function mockCreateTrip({ source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm }) {
  await delay();
  const vehicle = collection('vehicles').find((v) => v.id === vehicleId);
  const driver = collection('drivers').find((d) => d.id === driverId);
  const validation = validateTripCreation({ vehicle, driver, cargoWeightKg });
  if (!validation.ok) throw new Error(validation.reason);

  const record = {
    id: nextId('t'),
    source,
    destination,
    vehicleId,
    driverId,
    cargoWeightKg: Number(cargoWeightKg),
    plannedDistanceKm: Number(plannedDistanceKm),
    status: 'Draft',
    createdAt: new Date().toISOString(),
    dispatchedAt: null,
    completedAt: null,
    actualOdometer: null,
    fuelConsumedL: null,
    revenue: 0,
  };
  return upsert('trips', record);
}

export async function mockDispatchTrip(tripId) {
  await delay();
  const trips = collection('trips');
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found.');
  if (trip.status !== 'Draft') throw new Error('Only draft trips can be dispatched.');

  const vehicle = collection('vehicles').find((v) => v.id === trip.vehicleId);
  const driver = collection('drivers').find((d) => d.id === trip.driverId);
  const v = isVehicleAssignable(vehicle);
  if (!v.ok) throw new Error(v.reason);
  const d = isDriverAssignable(driver);
  if (!d.ok) throw new Error(d.reason);

  patch('vehicles', vehicle.id, { status: 'On Trip' });
  patch('drivers', driver.id, { status: 'On Trip' });
  return patch('trips', tripId, { status: 'Dispatched', dispatchedAt: new Date().toISOString() });
}

export async function mockCompleteTrip(tripId, { actualOdometer, fuelConsumedL, revenue }) {
  await delay();
  const trip = collection('trips').find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found.');
  if (trip.status !== 'Dispatched') throw new Error('Only dispatched trips can be completed.');

  patch('vehicles', trip.vehicleId, { status: 'Available', odometer: Number(actualOdometer) || undefined });
  patch('drivers', trip.driverId, { status: 'Available' });
  return patch('trips', tripId, {
    status: 'Completed',
    completedAt: new Date().toISOString(),
    actualOdometer: Number(actualOdometer) || null,
    fuelConsumedL: Number(fuelConsumedL) || null,
    revenue: Number(revenue) || trip.revenue || 0,
  });
}

export async function mockCancelTrip(tripId) {
  await delay();
  const trip = collection('trips').find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found.');
  if (trip.status === 'Dispatched') {
    patch('vehicles', trip.vehicleId, { status: 'Available' });
    patch('drivers', trip.driverId, { status: 'Available' });
  }
  return patch('trips', tripId, { status: 'Cancelled' });
}

// ---------- Maintenance ----------
export async function mockGetMaintenance() {
  await delay();
  return collection('maintenance');
}
export async function mockCreateMaintenance({ vehicleId, type, description, cost, date }) {
  await delay();
  const vehicle = collection('vehicles').find((v) => v.id === vehicleId);
  if (!vehicle) throw new Error('Vehicle not found.');
  const record = { id: nextId('m'), vehicleId, type, description, cost: Number(cost), date, status: 'Active' };
  upsert('maintenance', record);
  patch('vehicles', vehicleId, { status: 'In Shop' });
  return record;
}
export async function mockCloseMaintenance(id) {
  await delay();
  const record = collection('maintenance').find((m) => m.id === id);
  if (!record) throw new Error('Maintenance record not found.');
  const closed = patch('maintenance', id, { status: 'Closed' });
  const vehicle = collection('vehicles').find((v) => v.id === record.vehicleId);
  if (vehicle && vehicle.status !== 'Retired') {
    patch('vehicles', vehicle.id, { status: 'Available' });
  }
  return closed;
}

// ---------- Fuel logs ----------
export async function mockGetFuelLogs() {
  await delay();
  return collection('fuelLogs');
}
export async function mockCreateFuelLog({ vehicleId, liters, cost, date }) {
  await delay();
  const record = { id: nextId('f'), vehicleId, liters: Number(liters), cost: Number(cost), date };
  return upsert('fuelLogs', record);
}

// ---------- Expenses ----------
export async function mockGetExpenses() {
  await delay();
  return collection('expenses');
}
export async function mockCreateExpense({ vehicleId, category, amount, date }) {
  await delay();
  const record = { id: nextId('e'), vehicleId, category, amount: Number(amount), date };
  return upsert('expenses', record);
}
