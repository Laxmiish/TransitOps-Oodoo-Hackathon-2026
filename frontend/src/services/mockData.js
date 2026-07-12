// Seed data used when the real backend is unreachable.
// Kept small but realistic enough to exercise every business rule.

export const seedUsers = [
  { id: 'u1', name: 'Rohan Kapoor', email: 'fleet.manager@transitops.io', password: 'password123', role: 'Fleet Manager' },
  { id: 'u2', name: 'Alex Mathew', email: 'driver@transitops.io', password: 'password123', role: 'Driver' },
  { id: 'u3', name: 'Priya Nair', email: 'safety.officer@transitops.io', password: 'password123', role: 'Safety Officer' },
  { id: 'u4', name: 'Farah Sheikh', email: 'analyst@transitops.io', password: 'password123', role: 'Financial Analyst' },
];

export const seedVehicles = [
  { id: 'v1', regNo: 'UP32-AB-1042', name: 'Tata 407 - Van 05', type: 'Van', maxLoadKg: 500, odometer: 48210, acquisitionCost: 850000, status: 'Available', region: 'North' },
  { id: 'v2', regNo: 'UP32-CD-2077', name: 'Ashok Leyland - Truck 12', type: 'Truck', maxLoadKg: 3500, odometer: 122400, acquisitionCost: 2400000, status: 'On Trip', region: 'North' },
  { id: 'v3', regNo: 'DL01-EF-3391', name: 'Mahindra Bolero - Pickup 03', type: 'Pickup', maxLoadKg: 800, odometer: 76540, acquisitionCost: 950000, status: 'In Shop', region: 'South' },
  { id: 'v4', regNo: 'DL01-GH-4520', name: 'Eicher Pro - Truck 07', type: 'Truck', maxLoadKg: 4200, odometer: 201300, acquisitionCost: 2900000, status: 'Available', region: 'South' },
  { id: 'v5', regNo: 'MH04-IJ-5643', name: 'Force Traveller - Van 09', type: 'Van', maxLoadKg: 600, odometer: 33110, acquisitionCost: 1100000, status: 'Retired', region: 'West' },
  { id: 'v6', regNo: 'MH04-KL-6784', name: 'Tata Ace - Mini Truck 02', type: 'Mini Truck', maxLoadKg: 750, odometer: 58900, acquisitionCost: 700000, status: 'Available', region: 'West' },
];

export const seedDrivers = [
  { id: 'd1', name: 'Alex Mathew', licenseNo: 'DL-0420110012345', licenseCategory: 'HMV', licenseExpiry: '2027-03-15', contact: '+91 98765 43210', safetyScore: 92, status: 'Available' },
  { id: 'd2', name: 'Sandeep Rana', licenseNo: 'DL-0420110023456', licenseCategory: 'LMV', licenseExpiry: '2026-08-01', contact: '+91 98111 22334', safetyScore: 85, status: 'On Trip' },
  { id: 'd3', name: 'Imran Qureshi', licenseNo: 'DL-0420110034567', licenseCategory: 'HMV', licenseExpiry: '2025-12-20', contact: '+91 99887 76655', safetyScore: 78, status: 'Suspended' },
  { id: 'd4', name: 'Karan Bedi', licenseNo: 'DL-0420110045678', licenseCategory: 'LMV', licenseExpiry: '2026-11-30', contact: '+91 90000 11122', safetyScore: 88, status: 'Off Duty' },
  { id: 'd5', name: 'Vikram Suri', licenseNo: 'DL-0420110056789', licenseCategory: 'HMV', licenseExpiry: '2027-06-05', contact: '+91 93333 44455', safetyScore: 95, status: 'Available' },
];

export const seedTrips = [
  { id: 't1', source: 'Lucknow Hub', destination: 'Kanpur DC', vehicleId: 'v2', driverId: 'd2', cargoWeightKg: 2800, plannedDistanceKm: 92, status: 'Dispatched', createdAt: '2026-07-10T08:30:00', dispatchedAt: '2026-07-10T09:00:00', completedAt: null, actualOdometer: null, fuelConsumedL: null, revenue: 18500 },
  { id: 't2', source: 'Delhi Warehouse', destination: 'Gurugram Depot', vehicleId: 'v4', driverId: 'd1', cargoWeightKg: 1500, plannedDistanceKm: 34, status: 'Completed', createdAt: '2026-07-08T07:00:00', dispatchedAt: '2026-07-08T07:20:00', completedAt: '2026-07-08T09:10:00', actualOdometer: 201335, fuelConsumedL: 9.4, revenue: 6200 },
  { id: 't3', source: 'Pune Yard', destination: 'Nashik Store', vehicleId: 'v6', driverId: 'd5', cargoWeightKg: 400, plannedDistanceKm: 165, status: 'Draft', createdAt: '2026-07-12T06:00:00', dispatchedAt: null, completedAt: null, actualOdometer: null, fuelConsumedL: null, revenue: 0 },
  { id: 't4', source: 'Lucknow Hub', destination: 'Ayodhya Store', vehicleId: 'v1', driverId: 'd5', cargoWeightKg: 300, plannedDistanceKm: 135, status: 'Cancelled', createdAt: '2026-07-05T10:00:00', dispatchedAt: '2026-07-05T10:15:00', completedAt: null, actualOdometer: null, fuelConsumedL: null, revenue: 0 },
];

export const seedMaintenance = [
  { id: 'm1', vehicleId: 'v3', type: 'Brake Overhaul', description: 'Front brake pads and disc replacement', cost: 12500, date: '2026-07-09', status: 'Active' },
  { id: 'm2', vehicleId: 'v2', type: 'Oil Change', description: 'Routine 10k service', cost: 3200, date: '2026-06-28', status: 'Closed' },
];

export const seedFuelLogs = [
  { id: 'f1', vehicleId: 'v2', liters: 45.2, cost: 4520, date: '2026-07-10' },
  { id: 'f2', vehicleId: 'v4', liters: 9.4, cost: 940, date: '2026-07-08' },
  { id: 'f3', vehicleId: 'v1', liters: 20.1, cost: 2010, date: '2026-06-30' },
];

export const seedExpenses = [
  { id: 'e1', vehicleId: 'v2', category: 'Toll', amount: 850, date: '2026-07-10' },
  { id: 'e2', vehicleId: 'v4', category: 'Toll', amount: 120, date: '2026-07-08' },
];
