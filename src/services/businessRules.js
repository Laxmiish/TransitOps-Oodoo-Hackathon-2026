// Mandatory Business Rules from the TransitOps spec, centralized so
// both the dashboard UI and the mock fallback enforce them identically.

export function isLicenseExpired(driver, asOf = new Date()) {
  if (!driver.licenseExpiry) return true;
  return new Date(driver.licenseExpiry) < asOf;
}

export function isDriverAssignable(driver) {
  if (!driver) return { ok: false, reason: 'Driver not found.' };
  if (driver.status === 'Suspended') return { ok: false, reason: 'Driver is suspended.' };
  if (driver.status === 'On Trip') return { ok: false, reason: 'Driver is already on a trip.' };
  if (isLicenseExpired(driver)) return { ok: false, reason: 'Driver license has expired.' };
  return { ok: true };
}

export function isVehicleAssignable(vehicle) {
  if (!vehicle) return { ok: false, reason: 'Vehicle not found.' };
  if (vehicle.status === 'Retired') return { ok: false, reason: 'Vehicle is retired.' };
  if (vehicle.status === 'In Shop') return { ok: false, reason: 'Vehicle is in maintenance.' };
  if (vehicle.status === 'On Trip') return { ok: false, reason: 'Vehicle is already on a trip.' };
  return { ok: true };
}

export function isCargoWithinCapacity(vehicle, cargoWeightKg) {
  if (!vehicle) return { ok: false, reason: 'Vehicle not found.' };
  if (Number(cargoWeightKg) > Number(vehicle.maxLoadKg)) {
    return { ok: false, reason: `Cargo weight (${cargoWeightKg}kg) exceeds max capacity (${vehicle.maxLoadKg}kg).` };
  }
  return { ok: true };
}

export function validateTripCreation({ vehicle, driver, cargoWeightKg }) {
  const v = isVehicleAssignable(vehicle);
  if (!v.ok) return v;
  const d = isDriverAssignable(driver);
  if (!d.ok) return d;
  const c = isCargoWithinCapacity(vehicle, cargoWeightKg);
  if (!c.ok) return c;
  return { ok: true };
}

export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
export const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
