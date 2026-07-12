import {
  seedUsers, seedVehicles, seedDrivers, seedTrips,
  seedMaintenance, seedFuelLogs, seedExpenses,
} from './mockData';

const KEY = 'transitops_mock_db_v1';

function seedDb() {
  return {
    users: seedUsers,
    vehicles: seedVehicles,
    drivers: seedDrivers,
    trips: seedTrips,
    maintenance: seedMaintenance,
    fuelLogs: seedFuelLogs,
    expenses: seedExpenses,
  };
}

export function loadDb() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = seedDb();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const fresh = seedDb();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
}

export function saveDb(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDb() {
  const fresh = seedDb();
  saveDb(fresh);
  return fresh;
}

let idCounter = 1000;
export function nextId(prefix) {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter}`;
}

export function collection(name) {
  const db = loadDb();
  return db[name] || [];
}

export function upsert(name, record) {
  const db = loadDb();
  const list = db[name] || [];
  const idx = list.findIndex((r) => r.id === record.id);
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  db[name] = list;
  saveDb(db);
  return record;
}

export function patch(name, id, patchObj) {
  const db = loadDb();
  const list = db[name] || [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`${name} record ${id} not found`);
  list[idx] = { ...list[idx], ...patchObj };
  db[name] = list;
  saveDb(db);
  return list[idx];
}

export function remove(name, id) {
  const db = loadDb();
  db[name] = (db[name] || []).filter((r) => r.id !== id);
  saveDb(db);
}
