// -------------------------------------------------------------
// LOCAL MOCK STATE ENGINE DEFINITION & SEEDS
// -------------------------------------------------------------
const SEED_VEHICLES = [
  { id: "v-1", registrationNumber: "TX-101-A", name: "Ford Transit Van-05", type: "Van", maxLoad: 500, odometer: 25000, acquisitionCost: 35000, status: "Available", region: "TX" },
  { id: "v-2", registrationNumber: "CA-902-B", name: "Volvo FH16 Truck-01", type: "Truck", maxLoad: 15000, odometer: 120000, acquisitionCost: 145000, status: "Available", region: "CA" },
  { id: "v-3", registrationNumber: "NY-440-C", name: "Chevrolet Express Van-02", type: "Van", maxLoad: 800, odometer: 65000, acquisitionCost: 38000, status: "In Shop", region: "NY" },
  { id: "v-4", registrationNumber: "FL-882-D", name: "Tesla Semi Truck-02", type: "Truck", maxLoad: 20000, odometer: 15000, acquisitionCost: 180000, status: "On Trip", region: "FL" },
  { id: "v-5", registrationNumber: "TX-404-E", name: "Toyota Camry Hybrid", type: "Sedan", maxLoad: 350, odometer: 42000, acquisitionCost: 28000, status: "Retired", region: "TX" }
];

const SEED_DRIVERS = [
  { id: "d-1", name: "Alex Rivera", licenseNumber: "DL-908123", licenseCategory: "Class B", licenseExpiry: "2027-10-15", contactNumber: "+1 555-0192", safetyScore: 95, status: "Available" },
  { id: "d-2", name: "Sarah Jenkins", licenseNumber: "DL-456789", licenseCategory: "Class A", licenseExpiry: "2026-09-20", contactNumber: "+1 555-0143", safetyScore: 92, status: "On Trip" },
  { id: "d-3", name: "Michael Chang", licenseNumber: "DL-112233", licenseCategory: "Class B", licenseExpiry: "2026-02-14", contactNumber: "+1 555-0188", safetyScore: 88, status: "Available" },
  { id: "d-4", name: "David Miller", licenseNumber: "DL-998877", licenseCategory: "Class A", licenseExpiry: "2026-05-10", contactNumber: "+1 555-0122", safetyScore: 65, status: "Suspended" },
  { id: "d-5", name: "Robert Lee", licenseNumber: "DL-883311", licenseCategory: "Class C", licenseExpiry: "2026-08-11", contactNumber: "+1 555-0177", safetyScore: 90, status: "Off Duty" },
  // Expired license driver
  { id: "d-6", name: "Jonathan Carter", licenseNumber: "DL-334455", licenseCategory: "Class B", licenseExpiry: "2026-06-01", contactNumber: "+1 555-0101", safetyScore: 82, status: "Available" }
];

const SEED_TRIPS = [
  { id: "t-1", source: "Los Angeles, CA", destination: "Phoenix, AZ", vehicleId: "v-4", driverId: "d-2", cargoWeight: 18000, plannedDistance: 600, status: "Dispatched", createdAt: "2026-07-10" },
  { id: "t-2", source: "New York, NY", destination: "Boston, MA", vehicleId: "v-1", driverId: "d-1", cargoWeight: 400, plannedDistance: 350, status: "Completed", finalOdometer: 25350, fuelConsumed: 42, revenue: 1200, createdAt: "2026-07-08" }
];

const SEED_MAINTENANCE = [
  { id: "m-1", vehicleId: "v-3", description: "Regular Engine Tuning and Brake Pads Replacement", cost: 450, startDate: "2026-07-11", endDate: "", status: "Active" }
];

const SEED_EXPENSES = [
  { id: "e-1", vehicleId: "v-1", type: "Fuel", amount: 150, date: "2026-07-08", description: "Fuel Refill (42L) for Boston Trip" },
  { id: "e-2", vehicleId: "v-3", type: "Maintenance", amount: 450, date: "2026-07-11", description: "Regular Engine Tuning and Brake Pads Replacement" },
  { id: "e-3", vehicleId: "v-4", type: "Toll", amount: 65, date: "2026-07-10", description: "Highway I-10 Toll Fees" }
];

// Global state
let state = {
  role: "fleet_manager",
  theme: "light",
  activeTab: "dashboard",
  searchQuery: "",
  vehicles: [],
  drivers: [],
  trips: [],
  maintenance: [],
  expenses: []
};

// Chart handles to re-render
let financeChartInstance = null;
let fleetPieChartInstance = null;
let roiChartInstance = null;
let efficiencyChartInstance = null;

// Load initial configuration
function initApp() {
  // Load from localStorage or seeds
  state.vehicles = JSON.parse(localStorage.getItem("to_vehicles")) || SEED_VEHICLES;
  state.drivers = JSON.parse(localStorage.getItem("to_drivers")) || SEED_DRIVERS;
  state.trips = JSON.parse(localStorage.getItem("to_trips")) || SEED_TRIPS;
  state.maintenance = JSON.parse(localStorage.getItem("to_maintenance")) || SEED_MAINTENANCE;
  state.expenses = JSON.parse(localStorage.getItem("to_expenses")) || SEED_EXPENSES;
  
  // Load Theme Preference
  state.theme = localStorage.getItem("to_theme") || "light";
  if (state.theme === "dark") {
    document.documentElement.classList.add("dark");
    document.getElementById("theme-icon").setAttribute("data-lucide", "sun");
  }
  
  saveToStorage();
  
  // Initial Render
  switchTab(state.activeTab);
  changeActiveRole("fleet_manager"); // Default Role
  
  // Initialize Lucide Icons
  lucide.createIcons();
}

// Persist Database helper
function saveToStorage() {
  localStorage.setItem("to_vehicles", JSON.stringify(state.vehicles));
  localStorage.setItem("to_drivers", JSON.stringify(state.drivers));
  localStorage.setItem("to_trips", JSON.stringify(state.trips));
  localStorage.setItem("to_maintenance", JSON.stringify(state.maintenance));
  localStorage.setItem("to_expenses", JSON.stringify(state.expenses));
  localStorage.setItem("to_theme", state.theme);
}

// -------------------------------------------------------------
// RBAC & THEME CONTROLS
// -------------------------------------------------------------
function changeActiveRole(newRole) {
  state.role = newRole;
  
  // Update UI Header and Badge
  const displayObj = {
    fleet_manager: { name: "Fleet Manager", code: "FM" },
    driver: { name: "Driver / Dispatcher", code: "DD" },
    safety_officer: { name: "Safety Officer", code: "SO" },
    financial_analyst: { name: "Financial Analyst", code: "FA" }
  };
  
  document.getElementById("role-display-name").innerText = displayObj[newRole].name;
  document.getElementById("role-avatar").innerText = displayObj[newRole].code;
  document.getElementById("role-select").value = newRole;

  // Handle Component Restrictions according to chosen role
  // Clear previous hidden restrictions
  document.querySelectorAll(".btn-manager, .btn-manager-safety, .btn-driver-dispatcher, .btn-analyst").forEach(el => {
    el.classList.add("hidden");
  });

  // Role specific buttons displays
  if (newRole === "fleet_manager") {
    document.querySelectorAll(".btn-manager, .btn-manager-safety").forEach(el => el.classList.remove("hidden"));
  } else if (newRole === "driver") {
    document.querySelectorAll(".btn-driver-dispatcher").forEach(el => el.classList.remove("hidden"));
  } else if (newRole === "safety_officer") {
    document.querySelectorAll(".btn-manager-safety").forEach(el => el.classList.remove("hidden"));
  } else if (newRole === "financial_analyst") {
    document.querySelectorAll(".btn-analyst").forEach(el => el.classList.remove("hidden"));
  }

  // Hide financial reports or tabs if driver
  const navReportsBtn = document.getElementById("nav-reports");
  const navExpensesBtn = document.getElementById("nav-expenses");
  if (newRole === "driver") {
    navReportsBtn.classList.add("hidden");
    navExpensesBtn.classList.add("hidden");
    if (state.activeTab === "reports" || state.activeTab === "expenses") {
      switchTab("dashboard");
    }
  } else {
    navReportsBtn.classList.remove("hidden");
    navExpensesBtn.classList.remove("hidden");
  }

  // Re-trigger visual tabs builds
  switchTab(state.activeTab);
}

// Toggle Dark Mode
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  state.theme = isDark ? "dark" : "light";
  const icon = document.getElementById("theme-icon");
  icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
  saveToStorage();
  lucide.createIcons();
  
  // Update charts if present
  buildDashboardCharts();
  buildReportsCharts();
}

// Navigation Switcher
function switchTab(tabName) {
  state.activeTab = tabName;
  
  // Manage Active Tab Nav Buttons UI
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("bg-indigo-50", "dark:bg-indigo-950/40", "text-indigo-600", "dark:text-indigo-400");
    btn.classList.add("text-slate-600", "dark:text-slate-400", "hover:bg-slate-100", "dark:hover:bg-slate-800/60");
  });
  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.add("bg-indigo-50", "dark:bg-indigo-950/40", "text-indigo-600", "dark:text-indigo-400");
    activeBtn.classList.remove("text-slate-600", "dark:text-slate-400", "hover:bg-slate-100", "dark:hover:bg-slate-800/60");
  }

  // Hide all panels
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.add("hidden"));
  
  // Show targeted panel
  const targetPane = document.getElementById(`tab-${tabName}`);
  if (targetPane) targetPane.classList.remove("hidden");

  // Update Top Page Title
  const titleMap = {
    dashboard: "Dashboard Analytics",
    vehicles: "Vehicle Registry",
    drivers: "Driver Profiles Directory",
    trips: "Trip & Dispatch Log Board",
    maintenance: "Vehicle Maintenance & Services",
    expenses: "Fuel & General Expenses Logger",
    reports: "Fleet ROI & Performance Intelligence"
  };
  document.getElementById("current-page-title").innerText = titleMap[tabName] || "TransitOps";

  // Render tab-specific details
  if (tabName === "dashboard") refreshDashboard();
  else if (tabName === "vehicles") renderVehicles();
  else if (tabName === "drivers") renderDrivers();
  else if (tabName === "trips") renderTrips();
  else if (tabName === "maintenance") renderMaintenance();
  else if (tabName === "expenses") renderExpenses();
  else if (tabName === "reports") renderReports();
  
  lucide.createIcons();
}

// -------------------------------------------------------------
// LIVE ALERTS PANEL LOGIC
// -------------------------------------------------------------
function toggleAlertsFeed() {
  const el = document.getElementById("alerts-dropdown");
  el.classList.toggle("hidden");
}

function buildAlertsFeed() {
  const alerts = [];
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  // 1. License validity checks
  state.drivers.forEach(d => {
    const expiry = new Date(d.licenseExpiry);
    if (expiry < today) {
      alerts.push({
        type: "danger",
        title: "License Expired",
        desc: `${d.name}'s license (${d.licenseNumber}) expired on ${d.licenseExpiry}.`,
        icon: "alert-triangle"
      });
    } else if (expiry <= ninetyDaysFromNow) {
      const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: "warning",
        title: "License Expiring Soon",
        desc: `${d.name}'s license will expire in ${daysLeft} days (${d.licenseExpiry}).`,
        icon: "clock"
      });
    }

    if (d.status === "Suspended") {
      alerts.push({
        type: "danger",
        title: "Driver Suspended",
        desc: `${d.name} has suspended compliance privileges.`,
        icon: "shield-alert"
      });
    }
  });

  // 2. Vehicles in shop checks
  state.vehicles.forEach(v => {
    if (v.status === "In Shop") {
      alerts.push({
        type: "info",
        title: "Vehicle In Shop",
        desc: `${v.name} (${v.registrationNumber}) is currently down for maintenance.`,
        icon: "wrench"
      });
    }
  });

  // Render alerts in dropdown list
  const container = document.getElementById("alerts-list");
  container.innerHTML = "";
  
  const badge = document.getElementById("alerts-badge");
  const tag = document.getElementById("alert-count-tag");
  
  if (alerts.length === 0) {
    badge.classList.add("hidden");
    tag.innerText = "0 Alerts";
    tag.className = "text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-semibold";
    container.innerHTML = `<div class="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No active warnings or alerts.</div>`;
  } else {
    badge.classList.remove("hidden");
    tag.innerText = `${alerts.length} Active`;
    tag.className = `text-xs bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold`;
    
    alerts.forEach(a => {
      let typeColor = "bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400";
      let borderColor = "border-sky-100 dark:border-sky-900/30";
      if (a.type === "danger") {
        typeColor = "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400";
        borderColor = "border-rose-100 dark:border-rose-900/30";
      } else if (a.type === "warning") {
        typeColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400";
        borderColor = "border-amber-100 dark:border-amber-900/30";
      }

      const card = `
        <div class="p-2.5 border rounded-xl flex items-start gap-2.5 ${typeColor} ${borderColor} text-xs">
          <i data-lucide="${a.icon}" class="w-4 h-4 mt-0.5 flex-shrink-0"></i>
          <div class="space-y-0.5">
            <span class="font-bold">${a.title}</span>
            <p class="text-slate-600 dark:text-slate-400 leading-normal text-[11px]">${a.desc}</p>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", card);
    });
  }
  
  // Update quick dashboard highlights
  const remindersBox = document.getElementById("dashboard-reminders-box");
  if (remindersBox) {
    remindersBox.innerHTML = "";
    if (alerts.length === 0) {
      remindersBox.innerHTML = `<p class="text-xs text-slate-400 dark:text-slate-500">All drivers and fleet assets comply with rules.</p>`;
    } else {
      alerts.slice(0, 3).forEach(a => {
        const labelColor = a.type === "danger" ? "text-rose-500" : (a.type === "warning" ? "text-amber-500" : "text-sky-500");
        const item = `
          <div class="flex items-start gap-2 text-xs leading-normal">
            <i data-lucide="info" class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${labelColor}"></i>
            <p class="text-slate-600 dark:text-slate-400"><strong class="text-slate-700 dark:text-slate-300 font-semibold">${a.title}:</strong> ${a.desc.slice(0, 60)}...</p>
          </div>
        `;
        remindersBox.insertAdjacentHTML("beforeend", item);
      });
    }
  }

  lucide.createIcons();
}

// Global Search Handle
function handleGlobalSearch(query) {
  state.searchQuery = query.toLowerCase();
  // Delegate query updates to registry tables
  if (state.activeTab === "vehicles") renderVehicles();
  else if (state.activeTab === "drivers") renderDrivers();
  else if (state.activeTab === "trips") renderTrips();
}


// -------------------------------------------------------------
// ==================== 3.2 DASHBOARD MANAGEMENT ====================
// -------------------------------------------------------------
function refreshDashboard() {
  // 1. Live Alerts build
  buildAlertsFeed();

  // 2. Fetch filters
  const vType = document.getElementById("dash-filter-type").value;
  const vRegion = document.getElementById("dash-filter-region").value;

  // Filter vehicles based on type and region
  const filteredVehicles = state.vehicles.filter(v => {
    const matchesType = (vType === "All") || (v.type === vType);
    const matchesRegion = (vRegion === "All") || (v.region === vRegion);
    return matchesType && matchesRegion;
  });

  // Calculate stats
  const totalVehiclesCount = filteredVehicles.length;
  const activeVehiclesCount = filteredVehicles.filter(v => v.status === "On Trip").length;
  const availableVehiclesCount = filteredVehicles.filter(v => v.status === "Available").length;
  const maintenanceCount = filteredVehicles.filter(v => v.status === "In Shop").length;
  const retiredCount = filteredVehicles.filter(v => v.status === "Retired").length;

  // Fleet utilization: Active vehicles / Working Fleet (non-retired)
  const workingFleetCount = totalVehiclesCount - retiredCount;
  const utilizationVal = workingFleetCount > 0 ? Math.round((activeVehiclesCount / workingFleetCount) * 100) : 0;

  // Active trips count, Pending trips count
  const activeTripsCount = state.trips.filter(t => t.status === "Dispatched").length;
  const pendingTripsCount = state.trips.filter(t => t.status === "Draft").length;
  const driversOnDutyCount = state.drivers.filter(d => d.status === "On Trip" || d.status === "Available").length;

  // Update DOM
  document.getElementById("kpi-active-vehicles").innerText = activeVehiclesCount;
  document.getElementById("kpi-available-vehicles").innerText = availableVehiclesCount;
  document.getElementById("kpi-in-shop").innerText = maintenanceCount;
  document.getElementById("kpi-utilization").innerText = `${utilizationVal}%`;
  document.getElementById("utilization-bar").style.width = `${utilizationVal}%`;

  document.getElementById("kpi-active-trips").innerText = activeTripsCount;
  document.getElementById("kpi-pending-trips").innerText = pendingTripsCount;
  document.getElementById("kpi-drivers-duty").innerText = driversOnDutyCount;

  // Update Filter Indicator message
  const indicator = document.getElementById("dashboard-filter-indicator");
  indicator.innerText = `Displaying statistics for ${vType === "All" ? "all vehicle classes" : vType + " types"} ${vRegion === "All" ? "across all operating regions" : "in the " + vRegion + " region"}.`;

  buildDashboardCharts();
}

function buildDashboardCharts() {
  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  // --- Chart 1: Financial Performance (Bar Chart) ---
  const ctx1 = document.getElementById("financeChart").getContext("2d");
  if (financeChartInstance) financeChartInstance.destroy();
  
  // Calculate revenue and expenses by type
  let fuelCost = 0;
  let maintCost = 0;
  let tollCost = 0;
  let otherCost = 0;
  
  state.expenses.forEach(e => {
    if (e.type === "Fuel") fuelCost += Number(e.amount);
    else if (e.type === "Maintenance") maintCost += Number(e.amount);
    else if (e.type === "Toll") tollCost += Number(e.amount);
    else otherCost += Number(e.amount);
  });

  let totalRevenue = 0;
  state.trips.forEach(t => {
    if (t.revenue) totalRevenue += Number(t.revenue);
  });

  financeChartInstance = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Fuel Cost", "Maintenance", "Tolls & Other", "Total Expenses", "Trip Revenue"],
      datasets: [{
        label: "Amount (USD)",
        data: [fuelCost, maintCost, (tollCost + otherCost), (fuelCost + maintCost + tollCost + otherCost), totalRevenue],
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)", // indigo
          "rgba(245, 158, 11, 0.8)", // amber
          "rgba(14, 165, 233, 0.8)", // sky
          "rgba(239, 68, 68, 0.8)",  // rose
          "rgba(16, 185, 129, 0.8)"  // emerald
        ],
        borderColor: [
          "rgb(99, 102, 241)",
          "rgb(245, 158, 11)",
          "rgb(14, 165, 233)",
          "rgb(239, 68, 68)",
          "rgb(16, 185, 129)"
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  });

  // --- Chart 2: Fleet Status Chart (Doughnut) ---
  const ctx2 = document.getElementById("fleetPieChart").getContext("2d");
  if (fleetPieChartInstance) fleetPieChartInstance.destroy();

  const avail = state.vehicles.filter(v => v.status === "Available").length;
  const trip = state.vehicles.filter(v => v.status === "On Trip").length;
  const shop = state.vehicles.filter(v => v.status === "In Shop").length;
  const retired = state.vehicles.filter(v => v.status === "Retired").length;

  fleetPieChartInstance = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Available", "On Trip", "In Shop", "Retired"],
      datasets: [{
        data: [avail, trip, shop, retired],
        backgroundColor: [
          "#10b981", // emerald
          "#6366f1", // indigo
          "#f59e0b", // amber
          "#64748b"  // slate
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      cutout: "70%"
    }
  });
}


// -------------------------------------------------------------
// ==================== 3.3 VEHICLE REGISTRY ====================
// -------------------------------------------------------------
function renderVehicles() {
  const container = document.getElementById("vehicle-grid");
  container.innerHTML = "";
  
  const filterStatus = document.getElementById("vehicle-filter-status").value;
  const query = state.searchQuery;

  const items = state.vehicles.filter(v => {
    const matchesStatus = (filterStatus === "All") || (v.status === filterStatus);
    const matchesQuery = v.registrationNumber.toLowerCase().includes(query) || v.name.toLowerCase().includes(query) || v.type.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
        <i data-lucide="inbox" class="w-12 h-12 text-slate-400 mx-auto"></i>
        <h4 class="font-bold text-slate-700 dark:text-slate-300">No Vehicles Registered</h4>
        <p class="text-sm text-slate-500">Add a new transport asset to begin logistics mapping.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  items.forEach(v => {
    // Calculate operational cost for this vehicle (Fuel + Maintenance)
    const vExpenses = state.expenses.filter(e => e.vehicleId === v.id);
    const totalOpCost = vExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate ROI percentage
    const vTrips = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
    const totalRevenue = vTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalOpCost) / v.acquisitionCost * 100).toFixed(1) : 0;

    let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (v.status === "Available") badgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
    else if (v.status === "On Trip") badgeStyle = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 animate-pulse";
    else if (v.status === "In Shop") badgeStyle = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    else if (v.status === "Retired") badgeStyle = "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400";

    const showActions = state.role === "fleet_manager";

    const card = `
      <div class="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative group transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${v.type}</span>
            <h4 class="font-extrabold text-base text-slate-800 dark:text-white mt-0.5">${v.name}</h4>
            <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide mt-0.5">${v.registrationNumber}</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-full font-bold ${badgeStyle}">${v.status}</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800/60 py-3.5">
          <div class="space-y-0.5">
            <span class="text-slate-400">Max Payload</span>
            <p class="font-bold text-slate-700 dark:text-slate-300">${v.maxLoad} kg</p>
          </div>
          <div class="space-y-0.5">
            <span class="text-slate-400">Mileage (Odo)</span>
            <p class="font-bold text-slate-700 dark:text-slate-300">${v.odometer.toLocaleString()} km</p>
          </div>
          <div class="space-y-0.5">
            <span class="text-slate-400">Op Cost</span>
            <p class="font-bold text-rose-500">$${totalOpCost.toLocaleString()}</p>
          </div>
          <div class="space-y-0.5">
            <span class="text-slate-400">Acq. Cost</span>
            <p class="font-bold text-slate-700 dark:text-slate-300">$${v.acquisitionCost.toLocaleString()}</p>
          </div>
        </div>

        <div class="flex justify-between items-center text-xs">
          <div>
            <span class="text-slate-400">ROI:</span>
            <span class="font-bold ml-1 ${roi >= 0 ? "text-emerald-500" : "text-rose-500"}">${roi}%</span>
          </div>
          
          <div class="flex items-center gap-1.5 ${showActions ? "" : "hidden"}">
            <button onclick="openVehicleModal('${v.id}')" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all" title="Edit Vehicle">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="retireVehicle('${v.id}')" class="p-1.5 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 text-slate-500 rounded-lg transition-all" title="Retire Vehicle">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", card);
  });
  lucide.createIcons();
}

function openVehicleModal(id = "") {
  const modal = document.getElementById("modal-vehicle");
  const title = document.getElementById("vehicle-modal-title");
  const form = document.getElementById("form-vehicle");
  
  form.reset();
  document.getElementById("vehicle-id").value = id;

  if (id) {
    title.innerText = "Modify Vehicle Details";
    const v = state.vehicles.find(item => item.id === id);
    if (v) {
      document.getElementById("vehicle-reg").value = v.registrationNumber;
      document.getElementById("vehicle-reg").disabled = true; // reg must remain unique/uneditable once registered
      document.getElementById("vehicle-name").value = v.name;
      document.getElementById("vehicle-type").value = v.type;
      document.getElementById("vehicle-load").value = v.maxLoad;
      document.getElementById("vehicle-odometer").value = v.odometer;
      document.getElementById("vehicle-cost").value = v.acquisitionCost;
      document.getElementById("vehicle-status").value = v.status;
    }
  } else {
    title.innerText = "Register New Vehicle";
    document.getElementById("vehicle-reg").disabled = false;
  }
  modal.classList.remove("hidden");
}

function closeVehicleModal() {
  document.getElementById("modal-vehicle").classList.add("hidden");
}

function saveVehicle(e) {
  e.preventDefault();
  const id = document.getElementById("vehicle-id").value;
  const reg = document.getElementById("vehicle-reg").value.trim().toUpperCase();
  const name = document.getElementById("vehicle-name").value.trim();
  const type = document.getElementById("vehicle-type").value;
  const maxLoad = Number(document.getElementById("vehicle-load").value);
  const odometer = Number(document.getElementById("vehicle-odometer").value);
  const cost = Number(document.getElementById("vehicle-cost").value);
  const status = document.getElementById("vehicle-status").value;

  // Unique Registration check
  if (!id) {
    const exists = state.vehicles.some(v => v.registrationNumber === reg);
    if (exists) {
      alert(`Vehicle Registration Number "${reg}" already exists. Please choose a unique key.`);
      return;
    }
    
    // Add
    state.vehicles.push({
      id: `v-${Date.now()}`,
      registrationNumber: reg,
      name,
      type,
      maxLoad,
      odometer,
      acquisitionCost: cost,
      status,
      region: "TX" // default region mock
    });
  } else {
    // Edit
    const v = state.vehicles.find(item => item.id === id);
    if (v) {
      v.name = name;
      v.type = type;
      v.maxLoad = maxLoad;
      v.odometer = odometer;
      v.acquisitionCost = cost;
      v.status = status;
    }
  }

  saveToStorage();
  closeVehicleModal();
  renderVehicles();
}

function retireVehicle(id) {
  const v = state.vehicles.find(item => item.id === id);
  if (v) {
    if (confirm(`Are you sure you want to change ${v.name} status to Retired?`)) {
      v.status = "Retired";
      saveToStorage();
      renderVehicles();
    }
  }
}


// -------------------------------------------------------------
// ==================== 3.4 DRIVER MANAGEMENT ====================
// -------------------------------------------------------------
function renderDrivers() {
  const container = document.getElementById("driver-grid");
  container.innerHTML = "";
  
  const filterStatus = document.getElementById("driver-filter-status").value;
  const query = state.searchQuery;

  const items = state.drivers.filter(d => {
    const matchesStatus = (filterStatus === "All") || (d.status === filterStatus);
    const matchesQuery = d.name.toLowerCase().includes(query) || d.licenseNumber.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
        <i data-lucide="inbox" class="w-12 h-12 text-slate-400 mx-auto"></i>
        <h4 class="font-bold text-slate-700 dark:text-slate-300">No Drivers Found</h4>
        <p class="text-sm text-slate-500">Record a driver profile to assign commercial dispatches.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  items.forEach(d => {
    // Validation check for license validity
    const today = new Date();
    const expiry = new Date(d.licenseExpiry);
    const isExpired = expiry < today;
    const ninetyDays = new Date();
    ninetyDays.setDate(today.getDate() + 90);
    const isExpiringSoon = !isExpired && (expiry <= ninetyDays);

    let expiryStyle = "text-slate-700 dark:text-slate-300 font-semibold";
    if (isExpired) expiryStyle = "text-rose-500 font-extrabold";
    else if (isExpiringSoon) expiryStyle = "text-amber-500 font-bold";

    // Safety score color
    let safetyColor = "bg-emerald-500";
    if (d.safetyScore < 70) safetyColor = "bg-rose-500";
    else if (d.safetyScore < 85) safetyColor = "bg-amber-500";

    let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (d.status === "Available") badgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
    else if (d.status === "On Trip") badgeStyle = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 animate-pulse";
    else if (d.status === "Off Duty") badgeStyle = "bg-slate-100 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400";
    else if (d.status === "Suspended") badgeStyle = "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400";

    // Allow manager or safety officer to edit drivers
    const showActions = state.role === "fleet_manager" || state.role === "safety_officer";

    const card = `
      <div class="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative group hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div class="flex items-center gap-4">
          <!-- Avatar Circle with initial letter -->
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-base text-indigo-600 border border-slate-200 dark:border-slate-700">
            ${d.name.charAt(0)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="font-extrabold text-base text-slate-800 dark:text-white truncate">${d.name}</h4>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeStyle}">${d.status}</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${d.contactNumber}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 dark:border-slate-800/60 py-3.5">
          <div class="space-y-0.5">
            <span class="text-slate-400">License Number</span>
            <p class="font-bold text-slate-700 dark:text-slate-300">${d.licenseNumber} (${d.licenseCategory})</p>
          </div>
          <div class="space-y-0.5">
            <span class="text-slate-400">License Expiration</span>
            <p class="${expiryStyle}">${d.licenseExpiry} ${isExpired ? "(EXPIRED)" : ""}</p>
          </div>
        </div>

        <div class="flex items-center justify-between mt-1.5">
          <div class="flex-1 pr-6">
            <div class="flex justify-between text-xs font-semibold mb-1">
              <span class="text-slate-400">Safety Score:</span>
              <span class="text-slate-700 dark:text-slate-300">${d.safetyScore}/100</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="${safetyColor} h-full rounded-full" style="width: ${d.safetyScore}%"></div>
            </div>
          </div>
          
          <div class="flex items-center gap-1 ${showActions ? "" : "hidden"}">
            <button onclick="openDriverModal('${d.id}')" class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all" title="Edit Profile">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", card);
  });
  lucide.createIcons();
}

function openDriverModal(id = "") {
  const modal = document.getElementById("modal-driver");
  const title = document.getElementById("driver-modal-title");
  const form = document.getElementById("form-driver");
  
  form.reset();
  document.getElementById("driver-id").value = id;

  if (id) {
    title.innerText = "Modify Driver Profile";
    const d = state.drivers.find(item => item.id === id);
    if (d) {
      document.getElementById("driver-name").value = d.name;
      document.getElementById("driver-license").value = d.licenseNumber;
      document.getElementById("driver-category").value = d.licenseCategory;
      document.getElementById("driver-expiry").value = d.licenseExpiry;
      document.getElementById("driver-contact").value = d.contactNumber;
      document.getElementById("driver-safety").value = d.safetyScore;
      document.getElementById("driver-status").value = d.status;
    }
  } else {
    title.innerText = "Register Driver Profile";
  }
  modal.classList.remove("hidden");
}

function closeDriverModal() {
  document.getElementById("modal-driver").classList.add("hidden");
}

function saveDriver(e) {
  e.preventDefault();
  const id = document.getElementById("driver-id").value;
  const name = document.getElementById("driver-name").value.trim();
  const license = document.getElementById("driver-license").value.trim().toUpperCase();
  const category = document.getElementById("driver-category").value;
  const expiry = document.getElementById("driver-expiry").value;
  const contact = document.getElementById("driver-contact").value.trim();
  const safety = Number(document.getElementById("driver-safety").value);
  const status = document.getElementById("driver-status").value;

  if (!id) {
    state.drivers.push({
      id: `d-${Date.now()}`,
      name,
      licenseNumber: license,
      licenseCategory: category,
      licenseExpiry: expiry,
      contactNumber: contact,
      safetyScore: safety,
      status
    });
  } else {
    const d = state.drivers.find(item => item.id === id);
    if (d) {
      d.name = name;
      d.licenseNumber = license;
      d.licenseCategory = category;
      d.licenseExpiry = expiry;
      d.contactNumber = contact;
      d.safetyScore = safety;
      d.status = status;
    }
  }

  saveToStorage();
  closeDriverModal();
  renderDrivers();
}


// -------------------------------------------------------------
// ==================== 3.5 TRIP MANAGEMENT & DISPATCH ====================
// -------------------------------------------------------------
function renderTrips() {
  const colDraft = document.getElementById("col-draft");
  const colDispatched = document.getElementById("col-dispatched");
  const colCompleted = document.getElementById("col-completed");
  const colCancelled = document.getElementById("col-cancelled");

  colDraft.innerHTML = "";
  colDispatched.innerHTML = "";
  colCompleted.innerHTML = "";
  colCancelled.innerHTML = "";

  const query = state.searchQuery;
  const filterStatus = document.getElementById("trip-filter-status").value;

  const filteredTrips = state.trips.filter(t => {
    const matchesStatus = (filterStatus === "All") || (t.status === filterStatus);
    const matchesQuery = t.source.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  // Update Kanban Column Counters
  document.getElementById("count-draft").innerText = filteredTrips.filter(t => t.status === "Draft").length;
  document.getElementById("count-dispatched").innerText = filteredTrips.filter(t => t.status === "Dispatched").length;
  document.getElementById("count-completed").innerText = filteredTrips.filter(t => t.status === "Completed").length;
  document.getElementById("count-cancelled").innerText = filteredTrips.filter(t => t.status === "Cancelled").length;

  filteredTrips.forEach(t => {
    const vehicle = state.vehicles.find(v => v.id === t.vehicleId) || { name: "Unknown", registrationNumber: "Unknown" };
    const driver = state.drivers.find(d => d.id === t.driverId) || { name: "Unknown" };

    let btnControls = "";
    const isDriverOrDispatcher = state.role === "driver" || state.role === "fleet_manager";

    if (isDriverOrDispatcher) {
      if (t.status === "Draft") {
        btnControls = `
          <div class="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <button onclick="dispatchTrip('${t.id}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg transition-all text-[11px] cursor-pointer">Dispatch</button>
            <button onclick="cancelTrip('${t.id}')" class="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-500 font-bold py-1.5 px-2.5 rounded-lg transition-all text-[11px] cursor-pointer" title="Cancel Trip">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      } else if (t.status === "Dispatched") {
        btnControls = `
          <div class="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
            <button onclick="openCompleteTripModal('${t.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg transition-all text-[11px] cursor-pointer">Complete Trip</button>
            <button onclick="cancelTrip('${t.id}')" class="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-500 font-bold py-1.5 px-2.5 rounded-lg transition-all text-[11px] cursor-pointer" title="Cancel Trip">
              <i data-lucide="x-circle" class="w-4 h-4"></i>
            </button>
          </div>
        `;
      }
    }

    const summaryMetrics = t.status === "Completed" ? `
      <div class="mt-2.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-0.5 text-[10px]">
        <div class="flex justify-between"><span class="text-slate-400">Final Mileage:</span><span class="font-bold text-slate-700 dark:text-slate-200">${t.finalOdometer.toLocaleString()} km</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Fuel Logged:</span><span class="font-bold text-slate-700 dark:text-slate-200">${t.fuelConsumed} Liters</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Fuel Efficiency:</span><span class="font-bold text-emerald-500">${(t.plannedDistance / t.fuelConsumed).toFixed(1)} km/L</span></div>
        <div class="flex justify-between"><span class="text-slate-400">Revenue Generated:</span><span class="font-bold text-emerald-500">$${t.revenue.toLocaleString()}</span></div>
      </div>
    ` : "";

    const card = `
      <div class="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-2.5">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">ID: ${t.id}</span>
            <div class="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-1.5 flex items-center gap-1.5">
              <span>${t.source}</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>${t.destination}</span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5 text-[11px] border-t border-slate-100 dark:border-slate-800/40 pt-2.5">
          <div class="flex items-center justify-between text-slate-500">
            <span>Vehicle:</span>
            <span class="font-bold text-slate-700 dark:text-slate-300">${vehicle.name} (${vehicle.registrationNumber})</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Driver:</span>
            <span class="font-bold text-slate-700 dark:text-slate-300">${driver.name}</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Cargo weight / Dist:</span>
            <span class="font-bold text-slate-700 dark:text-slate-300">${t.cargoWeight} kg / ${t.plannedDistance} km</span>
          </div>
        </div>

        ${summaryMetrics}
        ${btnControls}
      </div>
    `;

    if (t.status === "Draft") colDraft.insertAdjacentHTML("beforeend", card);
    else if (t.status === "Dispatched") colDispatched.insertAdjacentHTML("beforeend", card);
    else if (t.status === "Completed") colCompleted.insertAdjacentHTML("beforeend", card);
    else if (t.status === "Cancelled") colCancelled.insertAdjacentHTML("beforeend", card);
  });

  lucide.createIcons();
}

function openTripModal() {
  // Clear warnings
  document.getElementById("trip-error-alert").classList.add("hidden");

  // Load vehicle selector (rules: Available + not Retired + not In Shop)
  const vSelect = document.getElementById("trip-vehicle");
  vSelect.innerHTML = `<option value="">-- Choose Available Vehicle --</option>`;
  
  const availableVehicles = state.vehicles.filter(v => v.status === "Available");
  availableVehicles.forEach(v => {
    vSelect.insertAdjacentHTML("beforeend", `<option value="${v.id}">${v.name} (${v.registrationNumber}) [Max Load: ${v.maxLoad}kg]</option>`);
  });

  // Load driver selector (rules: Available + Valid License + not Suspended)
  const dSelect = document.getElementById("trip-driver");
  dSelect.innerHTML = `<option value="">-- Choose Available Driver --</option>`;
  
  const today = new Date();
  const availableDrivers = state.drivers.filter(d => {
    const isAvail = d.status === "Available";
    const hasValidLicense = new Date(d.licenseExpiry) >= today;
    const isNotSuspended = d.status !== "Suspended";
    return isAvail && hasValidLicense && isNotSuspended;
  });

  availableDrivers.forEach(d => {
    dSelect.insertAdjacentHTML("beforeend", `<option value="${d.id}">${d.name} (Safety Score: ${d.safetyScore}/100)</option>`);
  });

  document.getElementById("form-trip").reset();
  document.getElementById("modal-trip").classList.remove("hidden");
}

function closeTripModal() {
  document.getElementById("modal-trip").classList.add("hidden");
}

function saveTrip(e) {
  e.preventDefault();
  const source = document.getElementById("trip-source").value.trim();
  const destination = document.getElementById("trip-destination").value.trim();
  const vehicleId = document.getElementById("trip-vehicle").value;
  const driverId = document.getElementById("trip-driver").value;
  const cargoWeight = Number(document.getElementById("trip-weight").value);
  const plannedDistance = Number(document.getElementById("trip-distance").value);

  // Check Business Rules
  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  const driver = state.drivers.find(d => d.id === driverId);

  const errorBox = document.getElementById("trip-error-alert");
  const errorText = document.getElementById("trip-error-text");

  if (!vehicle || !driver) {
    errorText.innerText = "Error: Invalid vehicle or driver allocation.";
    errorBox.classList.remove("hidden");
    return;
  }

  // Cargo limit validation rule
  if (cargoWeight > vehicle.maxLoad) {
    errorText.innerText = `Compliance Violation: Cargo Weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoad} kg).`;
    errorBox.classList.remove("hidden");
    return;
  }

  // Add to trips state as Draft
  state.trips.push({
    id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
    source,
    destination,
    vehicleId,
    driverId,
    cargoWeight,
    plannedDistance,
    status: "Draft",
    createdAt: new Date().toISOString().split("T")[0]
  });

  saveToStorage();
  closeTripModal();
  renderTrips();
}

function dispatchTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (trip) {
    const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
    const driver = state.drivers.find(d => d.id === trip.driverId);

    // Verification check of available statuses
    if (vehicle.status !== "Available" && vehicle.status !== "On Trip") {
      alert(`Compliance Error: Vehicle is not Available (Current status: ${vehicle.status})`);
      return;
    }
    if (driver.status !== "Available" && driver.status !== "On Trip") {
      alert(`Compliance Error: Driver is not Available (Current status: ${driver.status})`);
      return;
    }

    // Set status transitions
    trip.status = "Dispatched";
    vehicle.status = "On Trip";
    driver.status = "On Trip";

    saveToStorage();
    renderTrips();
    refreshDashboard();
  }
}

// Cancel Active Trip
function cancelTrip(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (trip) {
    if (confirm("Are you sure you want to cancel this dispatch order?")) {
      const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
      const driver = state.drivers.find(d => d.id === trip.driverId);

      trip.status = "Cancelled";
      
      // Restore vehicle/driver to Available
      if (vehicle && vehicle.status === "On Trip") vehicle.status = "Available";
      if (driver && driver.status === "On Trip") driver.status = "Available";

      saveToStorage();
      renderTrips();
      refreshDashboard();
    }
  }
}

function openCompleteTripModal(tripId) {
  const trip = state.trips.find(t => t.id === tripId);
  if (trip) {
    const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
    
    document.getElementById("complete-trip-id").value = tripId;
    document.getElementById("complete-vehicle-name").innerText = vehicle.name;
    document.getElementById("complete-vehicle-initial-odom").innerText = `${vehicle.odometer.toLocaleString()} km`;
    document.getElementById("complete-final-odometer").min = vehicle.odometer;
    document.getElementById("complete-final-odometer").value = vehicle.odometer + trip.plannedDistance;
    document.getElementById("complete-fuel-consumed").value = Math.round(trip.plannedDistance / 8); // seed mock
    
    document.getElementById("modal-complete-trip").classList.remove("hidden");
  }
}

function closeCompleteTripModal() {
  document.getElementById("modal-complete-trip").classList.add("hidden");
}

function submitCompleteTrip(e) {
  e.preventDefault();
  const tripId = document.getElementById("complete-trip-id").value;
  const finalOdo = Number(document.getElementById("complete-final-odometer").value);
  const fuelVal = Number(document.getElementById("complete-fuel-consumed").value);
  const fuelCostUnit = Number(document.getElementById("complete-fuel-cost").value);
  const revenue = Number(document.getElementById("complete-revenue").value);

  const trip = state.trips.find(t => t.id === tripId);
  if (trip) {
    const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
    const driver = state.drivers.find(d => d.id === trip.driverId);

    if (finalOdo < vehicle.odometer) {
      alert(`Input error: Final odometer must be greater than or equal to initial mileage (${vehicle.odometer} km).`);
      return;
    }

    // 1. Transition statuses
    trip.status = "Completed";
    trip.finalOdometer = finalOdo;
    trip.fuelConsumed = fuelVal;
    trip.revenue = revenue;

    // Update odometer reading on vehicle
    vehicle.odometer = finalOdo;
    vehicle.status = "Available";
    driver.status = "Available";

    // 2. Generate fuel expense entry automatically
    const totalFuelCost = fuelVal * fuelCostUnit;
    state.expenses.push({
      id: `e-${Date.now()}`,
      vehicleId: vehicle.id,
      type: "Fuel",
      amount: totalFuelCost,
      date: new Date().toISOString().split("T")[0],
      description: `Logged Fuel Refill (${fuelVal}L) upon completing Trip ${trip.id}`
    });

    saveToStorage();
    closeCompleteTripModal();
    renderTrips();
    refreshDashboard();
  }
}


// -------------------------------------------------------------
// ==================== 3.6 MAINTENANCE LOGIC ====================
// -------------------------------------------------------------
function renderMaintenance() {
  const tbody = document.getElementById("maintenance-table-body");
  tbody.innerHTML = "";

  if (state.maintenance.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
          No active or historical maintenance logs recorded.
        </td>
      </tr>
    `;
    return;
  }

  state.maintenance.forEach(log => {
    const vehicle = state.vehicles.find(v => v.id === log.vehicleId) || { name: "Unknown", registrationNumber: "Unknown" };
    
    let statusStyle = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    if (log.status === "Completed") statusStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";

    const showCloseAction = state.role === "fleet_manager" && log.status === "Active";

    const tr = `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
        <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
          <div>${vehicle.name}</div>
          <span class="text-xs text-indigo-500 font-semibold">${vehicle.registrationNumber}</span>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">${log.description}</td>
        <td class="px-6 py-4 text-xs font-semibold text-slate-500">${log.startDate}</td>
        <td class="px-6 py-4 text-xs font-semibold text-slate-500">${log.endDate || "—"}</td>
        <td class="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">$${log.cost.toLocaleString()}</td>
        <td class="px-6 py-4"><span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${statusStyle}">${log.status}</span></td>
        <td class="px-6 py-4 text-right">
          <button onclick="closeMaintenance('${log.id}')" class="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer ${showCloseAction ? "" : "hidden"}">
            Resolve & Close
          </button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });
}

function openMaintenanceModal() {
  const vSelect = document.getElementById("maint-vehicle");
  vSelect.innerHTML = `<option value="">-- Choose Target Vehicle --</option>`;
  
  // Filter out retired vehicles
  const activeVehicles = state.vehicles.filter(v => v.status !== "Retired");
  activeVehicles.forEach(v => {
    vSelect.insertAdjacentHTML("beforeend", `<option value="${v.id}">${v.name} (${v.registrationNumber}) [Status: ${v.status}]</option>`);
  });

  document.getElementById("form-maintenance").reset();
  document.getElementById("maint-start").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-maintenance").classList.remove("hidden");
}

function closeMaintenanceModal() {
  document.getElementById("modal-maintenance").classList.add("hidden");
}

function saveMaintenance(e) {
  e.preventDefault();
  const vehicleId = document.getElementById("maint-vehicle").value;
  const description = document.getElementById("maint-desc").value.trim();
  const cost = Number(document.getElementById("maint-cost").value);
  const startDate = document.getElementById("maint-start").value;

  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  if (vehicle) {
    // Business Rule: Auto switch vehicle status to "In Shop"
    vehicle.status = "In Shop";

    const logId = `m-${Date.now()}`;
    state.maintenance.push({
      id: logId,
      vehicleId,
      description,
      cost,
      startDate,
      endDate: "",
      status: "Active"
    });

    // Log this maintenance event as an operation expense
    state.expenses.push({
      id: `e-${Date.now()}`,
      vehicleId,
      type: "Maintenance",
      amount: cost,
      date: startDate,
      description: `Maintenance: ${description}`
    });

    saveToStorage();
    closeMaintenanceModal();
    renderMaintenance();
    refreshDashboard();
  }
}

function closeMaintenance(logId) {
  const log = state.maintenance.find(m => m.id === logId);
  if (log) {
    const vehicle = state.vehicles.find(v => v.id === log.vehicleId);
    
    if (confirm(`Do you wish to resolve service log for ${vehicle.name}? Vehicle status will return to Available.`)) {
      log.status = "Completed";
      log.endDate = new Date().toISOString().split("T")[0];

      // Restore vehicle to available unless marked retired
      if (vehicle && vehicle.status === "In Shop") {
        vehicle.status = "Available";
      }

      saveToStorage();
      renderMaintenance();
      refreshDashboard();
    }
  }
}


// -------------------------------------------------------------
// ==================== 3.7 FUEL & EXPENSES ====================
// -------------------------------------------------------------
function renderExpenses() {
  const tbody = document.getElementById("expenses-table-body");
  tbody.innerHTML = "";

  if (state.expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
          No operational expenses logged.
        </td>
      </tr>
    `;
    return;
  }

  state.expenses.forEach(e => {
    const vehicle = state.vehicles.find(v => v.id === e.vehicleId) || { name: "General Fleet", registrationNumber: "Generic" };
    
    let typeBadge = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (e.type === "Fuel") typeBadge = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400";
    else if (e.type === "Maintenance") typeBadge = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    else if (e.type === "Toll") typeBadge = "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400";

    const tr = `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
        <td class="px-6 py-4 text-xs font-semibold text-slate-500">${e.date}</td>
        <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
          <div>${vehicle.name}</div>
          <span class="text-xs text-indigo-500 font-semibold">${vehicle.registrationNumber}</span>
        </td>
        <td class="px-6 py-4"><span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${typeBadge}">${e.type}</span></td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">${e.description}</td>
        <td class="px-6 py-4 font-bold text-rose-500">$${e.amount.toLocaleString()}</td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });
}

function openExpenseModal() {
  const vSelect = document.getElementById("expense-vehicle");
  vSelect.innerHTML = `<option value="">-- General / No Specific Vehicle --</option>`;
  
  const activeVehicles = state.vehicles.filter(v => v.status !== "Retired");
  activeVehicles.forEach(v => {
    vSelect.insertAdjacentHTML("beforeend", `<option value="${v.id}">${v.name} (${v.registrationNumber})</option>`);
  });

  document.getElementById("form-expense").reset();
  document.getElementById("expense-date").value = new Date().toISOString().split("T")[0];
  document.getElementById("modal-expense").classList.remove("hidden");
}

function closeExpenseModal() {
  document.getElementById("modal-expense").classList.add("hidden");
}

function saveExpense(e) {
  e.preventDefault();
  const vehicleId = document.getElementById("expense-vehicle").value;
  const type = document.getElementById("expense-type").value;
  const amount = Number(document.getElementById("expense-amount").value);
  const date = document.getElementById("expense-date").value;
  const description = document.getElementById("expense-desc").value.trim();

  state.expenses.push({
    id: `e-${Date.now()}`,
    vehicleId,
    type,
    amount,
    date,
    description
  });

  saveToStorage();
  closeExpenseModal();
  renderExpenses();
  refreshDashboard();
}


// -------------------------------------------------------------
// ==================== 3.8 REPORTS & ANALYTICS ====================
// -------------------------------------------------------------
function renderReports() {
  const tbody = document.getElementById("reports-table-body");
  tbody.innerHTML = "";

  state.vehicles.forEach(v => {
    // Total distance completed by trips of this vehicle
    const vTrips = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
    const totalDistance = vTrips.reduce((sum, t) => sum + Number(t.plannedDistance), 0);
    const totalFuel = vTrips.reduce((sum, t) => sum + Number(t.fuelConsumed), 0);

    // Avg Efficiency
    const efficiency = totalFuel > 0 ? (totalDistance / totalFuel).toFixed(2) : "0.00";

    // Total operational cost
    const vExpenses = state.expenses.filter(e => e.vehicleId === v.id);
    const totalOpCost = vExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Revenue
    const totalRevenue = vTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);

    // ROI Formula: [Revenue - Operational Cost] / Acquisition Cost * 100
    const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalOpCost) / v.acquisitionCost * 100).toFixed(1) : "0.0";

    const tr = `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all font-semibold text-slate-600 dark:text-slate-400">
        <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
          <div>${v.name}</div>
          <span class="text-xs text-indigo-500 font-semibold">${v.registrationNumber}</span>
        </td>
        <td class="px-6 py-4">${totalDistance.toLocaleString()} km</td>
        <td class="px-6 py-4">${totalFuel.toLocaleString()} L</td>
        <td class="px-6 py-4 text-emerald-500">${efficiency} km/L</td>
        <td class="px-6 py-4 text-slate-700 dark:text-slate-300">$${v.acquisitionCost.toLocaleString()}</td>
        <td class="px-6 py-4 text-rose-500">$${totalOpCost.toLocaleString()}</td>
        <td class="px-6 py-4 text-emerald-500">$${totalRevenue.toLocaleString()}</td>
        <td class="px-6 py-4"><span class="${roi >= 0 ? "text-emerald-500" : "text-rose-500"} font-bold">${roi}%</span></td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });

  buildReportsCharts();
}

function buildReportsCharts() {
  const isDark = document.documentElement.classList.contains("dark");
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const labels = state.vehicles.map(v => v.registrationNumber);
  
  // Calculate data arrays
  const roiData = [];
  const efficiencyData = [];

  state.vehicles.forEach(v => {
    const vTrips = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
    const totalDistance = vTrips.reduce((sum, t) => sum + Number(t.plannedDistance), 0);
    const totalFuel = vTrips.reduce((sum, t) => sum + Number(t.fuelConsumed), 0);
    const efficiency = totalFuel > 0 ? (totalDistance / totalFuel) : 0;

    const vExpenses = state.expenses.filter(e => e.vehicleId === v.id);
    const totalOpCost = vExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalRevenue = vTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalOpCost) / v.acquisitionCost * 100) : 0;

    roiData.push(Number(roi.toFixed(1)));
    efficiencyData.push(Number(efficiency.toFixed(1)));
  });

  // ROI Bar Chart
  const ctx1 = document.getElementById("roiChart").getContext("2d");
  if (roiChartInstance) roiChartInstance.destroy();
  roiChartInstance = new Chart(ctx1, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Vehicle ROI (%)",
        data: roiData,
        backgroundColor: roiData.map(val => val >= 0 ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)"),
        borderColor: roiData.map(val => val >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"),
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });

  // Fuel Efficiency Bar Chart
  const ctx2 = document.getElementById("efficiencyChart").getContext("2d");
  if (efficiencyChartInstance) efficiencyChartInstance.destroy();
  efficiencyChartInstance = new Chart(ctx2, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Efficiency (km/L)",
        data: efficiencyData,
        backgroundColor: "rgba(99, 102, 241, 0.85)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });
}

// CSV Export Handler
function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Registration Number,Model Name,Type,Max Load (kg),Odometer (km),Acquisition Cost (USD),Total Operational Cost (USD),Generated Revenue (USD),ROI (%)\n";

  state.vehicles.forEach(v => {
    const vTrips = state.trips.filter(t => t.vehicleId === v.id && t.status === "Completed");
    const totalOpCost = state.expenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + Number(e.amount), 0);
    const totalRevenue = vTrips.reduce((sum, t) => sum + Number(t.revenue || 0), 0);
    const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalOpCost) / v.acquisitionCost * 100).toFixed(1) : 0;

    csvContent += `"${v.registrationNumber}","${v.name}","${v.type}",${v.maxLoad},${v.odometer},${v.acquisitionCost},${totalOpCost},${totalRevenue},${roi}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `transitops_fleet_report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// INITIALIZATION TRIGGER
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", initApp);
