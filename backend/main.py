from fastapi import FastAPI, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from pydantic import BaseModel
import datetime
import sys
import os

# Fix for Vercel deployment: add the 'backend' folder to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils import schemas
from utils.database import get_db

app = FastAPI(
    title="TransitOps API Gateway",
    description="Main entrypoint with fully working API endpoints and strict business rules."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def strip_api_prefix(request, call_next):
    if request.scope.get("path", "").startswith("/api"):
        request.scope["path"] = request.scope["path"][4:]
    return await call_next(request)

@app.get("/")
def root():
    return {"message": "Welcome to TransitOps API", "version": "1.0.0"}

from utils.cryptography import verify_password, get_password_hash
from utils.auth import create_access_token, require_roles, get_current_user

# ==========================================
# Authentication (Login)
# ==========================================
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT id, email, password_hash, role_id FROM users WHERE email = :email"),
        {"email": form_data.username}
    ).fetchone()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    role = db.execute(
        text("SELECT name FROM roles WHERE id = :role_id"), 
        {"role_id": user.role_id}
    ).scalar()

    access_token = create_access_token(
        data={"sub": user.email, "role": role, "user_id": user.id}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": role}

# ==========================================
# Vehicles
# ==========================================
@app.get("/vehicles", response_model=List[schemas.Vehicle])
def get_vehicles(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM vehicles ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/vehicles", response_model=schemas.Vehicle, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager", "Manager"]))
):
    # Check unique registration number
    existing = db.execute(
        text("SELECT id FROM vehicles WHERE registration_number = :reg"),
        {"reg": vehicle.registration_number}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Registration number must be unique")

    result = db.execute(
        text("""
            INSERT INTO vehicles (registration_number, name, model, vehicle_type, max_load_capacity, odometer, acquisition_cost, status)
            VALUES (:reg, :name, :model, :vtype, :cap, :odo, :cost, :status)
            RETURNING *
        """),
        {
            "reg": vehicle.registration_number, "name": vehicle.name, "model": vehicle.model,
            "vtype": vehicle.vehicle_type, "cap": vehicle.max_load_capacity, "odo": vehicle.odometer,
            "cost": vehicle.acquisition_cost, "status": vehicle.status
        }
    )
    db.commit()
    return result.fetchone()._mapping

@app.get("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM vehicles WHERE id = :id"), {"id": vehicle_id}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return result._mapping

@app.put("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def update_vehicle(
    vehicle_id: int,
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager", "Manager"]))
):
    # Check unique registration number (exclude self)
    existing = db.execute(
        text("SELECT id FROM vehicles WHERE registration_number = :reg AND id != :id"),
        {"reg": vehicle.registration_number, "id": vehicle_id}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Registration number must be unique")

    result = db.execute(
        text("""
            UPDATE vehicles SET
                registration_number = :reg, name = :name, model = :model, vehicle_type = :vtype,
                max_load_capacity = :cap, odometer = :odo, acquisition_cost = :cost, status = :status
            WHERE id = :id RETURNING *
        """),
        {
            "reg": vehicle.registration_number, "name": vehicle.name, "model": vehicle.model,
            "vtype": vehicle.vehicle_type, "cap": vehicle.max_load_capacity, "odo": vehicle.odometer,
            "cost": vehicle.acquisition_cost, "status": vehicle.status, "id": vehicle_id
        }
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.commit()
    return result._mapping

class VehicleStatusUpdate(BaseModel):
    status: str

@app.patch("/vehicles/{vehicle_id}/status", response_model=schemas.Vehicle)
def update_vehicle_status(
    vehicle_id: int,
    status_update: VehicleStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager", "Manager", "Dispatcher"]))
):
    result = db.execute(
        text("UPDATE vehicles SET status = :status WHERE id = :id RETURNING *"),
        {"status": status_update.status, "id": vehicle_id}
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.commit()
    return result._mapping

@app.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager"]))
):
    # Cannot delete a vehicle that is on a trip
    vehicle = db.execute(text("SELECT status FROM vehicles WHERE id = :id"), {"id": vehicle_id}).fetchone()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Cannot delete a vehicle that is currently on a trip")
    db.execute(text("DELETE FROM vehicles WHERE id = :id"), {"id": vehicle_id})
    db.commit()

# ==========================================
# Drivers
# ==========================================
@app.get("/drivers", response_model=List[schemas.Driver])
def get_drivers(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM drivers ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/drivers", response_model=schemas.Driver, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Safety Officer", "Fleet Manager", "Manager"]))
):
    result = db.execute(
        text("""
            INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
            VALUES (:name, :lic, :cat, :exp, :contact, :score, :status)
            RETURNING *
        """),
        {
            "name": driver.name, "lic": driver.license_number, "cat": driver.license_category,
            "exp": driver.license_expiry_date, "contact": driver.contact_number, "score": driver.safety_score,
            "status": driver.status
        }
    )
    db.commit()
    return result.fetchone()._mapping

@app.get("/drivers/{driver_id}", response_model=schemas.Driver)
def get_driver(driver_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM drivers WHERE id = :id"), {"id": driver_id}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")
    return result._mapping

@app.put("/drivers/{driver_id}", response_model=schemas.Driver)
def update_driver(
    driver_id: int,
    driver: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Safety Officer", "Fleet Manager", "Manager"]))
):
    result = db.execute(
        text("""
            UPDATE drivers SET
                name = :name, license_number = :lic, license_category = :cat,
                license_expiry_date = :exp, contact_number = :contact, safety_score = :score, status = :status
            WHERE id = :id RETURNING *
        """),
        {
            "name": driver.name, "lic": driver.license_number, "cat": driver.license_category,
            "exp": driver.license_expiry_date, "contact": driver.contact_number, "score": driver.safety_score,
            "status": driver.status, "id": driver_id
        }
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.commit()
    return result._mapping

class DriverStatusUpdate(BaseModel):
    status: str

@app.patch("/drivers/{driver_id}/status", response_model=schemas.Driver)
def update_driver_status(
    driver_id: int,
    status_update: DriverStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Safety Officer", "Fleet Manager", "Manager"]))
):
    result = db.execute(
        text("UPDATE drivers SET status = :status WHERE id = :id RETURNING *"),
        {"status": status_update.status, "id": driver_id}
    ).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.commit()
    return result._mapping

@app.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Safety Officer", "Fleet Manager"]))
):
    driver = db.execute(text("SELECT status FROM drivers WHERE id = :id"), {"id": driver_id}).fetchone()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.status == "On Trip":
        raise HTTPException(status_code=400, detail="Cannot delete a driver who is currently on a trip")
    db.execute(text("DELETE FROM drivers WHERE id = :id"), {"id": driver_id})
    db.commit()

# ==========================================
# Trips
# ==========================================
@app.get("/trips", response_model=List[schemas.Trip])
def get_trips(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM trips ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/trips", response_model=schemas.Trip, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Driver", "Dispatcher", "Fleet Manager"]))
):
    vehicle = db.execute(text("SELECT status, max_load_capacity FROM vehicles WHERE id = :vid"), {"vid": trip.vehicle_id}).fetchone()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status in ["Retired", "In Shop"]:
        raise HTTPException(status_code=400, detail="Cannot dispatch a retired or in-shop vehicle")
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Vehicle is already on a trip")
    if trip.cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(status_code=400, detail=f"Cargo weight ({trip.cargo_weight}kg) exceeds vehicle capacity ({vehicle.max_load_capacity}kg)")

    driver = db.execute(text("SELECT status, license_expiry_date FROM drivers WHERE id = :did"), {"did": trip.driver_id}).fetchone()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    if driver.status == "Suspended":
        raise HTTPException(status_code=400, detail="Cannot assign a suspended driver")
    if driver.status == "On Trip":
        raise HTTPException(status_code=400, detail="Driver is already on a trip")
    if driver.license_expiry_date < datetime.date.today():
        raise HTTPException(status_code=400, detail="Driver's license is expired")

    # If creating as Dispatched, update statuses immediately
    if trip.status == "Dispatched":
        db.execute(text("UPDATE vehicles SET status = 'On Trip' WHERE id = :vid"), {"vid": trip.vehicle_id})
        db.execute(text("UPDATE drivers SET status = 'On Trip' WHERE id = :did"), {"did": trip.driver_id})

    result = db.execute(
        text("""
            INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, status, fuel_consumed, revenue)
            VALUES (:src, :dst, :vid, :did, :weight, :p_dist, :a_dist, :status, :fuel, :revenue)
            RETURNING *
        """),
        {
            "src": trip.source, "dst": trip.destination, "vid": trip.vehicle_id, "did": trip.driver_id,
            "weight": trip.cargo_weight, "p_dist": trip.planned_distance, "a_dist": trip.actual_distance,
            "status": trip.status, "fuel": trip.fuel_consumed, "revenue": trip.revenue
        }
    )
    db.commit()
    return result.fetchone()._mapping

@app.get("/trips/{trip_id}", response_model=schemas.Trip)
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM trips WHERE id = :id"), {"id": trip_id}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Trip not found")
    return result._mapping

class TripCompleteUpdate(BaseModel):
    status: str
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: Optional[float] = None

@app.patch("/trips/{trip_id}/status", response_model=schemas.Trip)
def update_trip_status(
    trip_id: int,
    trip_status: TripCompleteUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    trip = db.execute(text("SELECT * FROM trips WHERE id = :id"), {"id": trip_id}).fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    new_status = trip_status.status
    old_status = trip.status

    if new_status == "Dispatched" and old_status != "Dispatched":
        vehicle = db.execute(text("SELECT status FROM vehicles WHERE id = :vid"), {"vid": trip.vehicle_id}).fetchone()
        driver = db.execute(text("SELECT status, license_expiry_date FROM drivers WHERE id = :did"), {"did": trip.driver_id}).fetchone()
        
        if vehicle.status in ["Retired", "In Shop", "On Trip"]:
            raise HTTPException(status_code=400, detail="Vehicle is not available for dispatch")
        if driver.status in ["Suspended", "On Trip"]:
            raise HTTPException(status_code=400, detail="Driver is not available for dispatch")
        if driver.license_expiry_date < datetime.date.today():
            raise HTTPException(status_code=400, detail="Driver's license is expired")
            
        db.execute(text("UPDATE vehicles SET status = 'On Trip' WHERE id = :vid"), {"vid": trip.vehicle_id})
        db.execute(text("UPDATE drivers SET status = 'On Trip' WHERE id = :did"), {"did": trip.driver_id})

    elif new_status in ["Completed", "Cancelled"] and old_status == "Dispatched":
        db.execute(text("UPDATE vehicles SET status = 'Available' WHERE id = :vid"), {"vid": trip.vehicle_id})
        db.execute(text("UPDATE drivers SET status = 'Available' WHERE id = :did"), {"did": trip.driver_id})
        
        # On Completed, update odometer and auto-create a fuel log if data provided
        if new_status == "Completed":
            if trip_status.actual_distance:
                db.execute(
                    text("UPDATE vehicles SET odometer = odometer + :dist WHERE id = :vid"),
                    {"dist": trip_status.actual_distance, "vid": trip.vehicle_id}
                )
            if trip_status.fuel_consumed and trip_status.fuel_consumed > 0:
                # Auto-create fuel log
                fuel_cost = trip_status.fuel_consumed * 90  # Estimated ₹90/liter default
                db.execute(
                    text("""
                        INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
                        VALUES (:vid, :tid, :liters, :cost, :date)
                    """),
                    {
                        "vid": trip.vehicle_id, "tid": trip_id,
                        "liters": trip_status.fuel_consumed,
                        "cost": fuel_cost,
                        "date": datetime.date.today()
                    }
                )

    # Build update fields
    update_fields = {"status": new_status, "id": trip_id}
    extra_sets = ""
    if trip_status.actual_distance is not None:
        update_fields["actual_distance"] = trip_status.actual_distance
        extra_sets += ", actual_distance = :actual_distance"
    if trip_status.fuel_consumed is not None:
        update_fields["fuel_consumed"] = trip_status.fuel_consumed
        extra_sets += ", fuel_consumed = :fuel_consumed"
    if trip_status.revenue is not None:
        update_fields["revenue"] = trip_status.revenue
        extra_sets += ", revenue = :revenue"

    result = db.execute(
        text(f"UPDATE trips SET status = :status{extra_sets} WHERE id = :id RETURNING *"),
        update_fields
    ).fetchone()
    db.commit()
    return result._mapping

# ==========================================
# Users & Roles
# ==========================================
@app.get("/users", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["Admin", "Fleet Manager"]))):
    result = db.execute(text("SELECT * FROM users"))
    return [row._mapping for row in result]

@app.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_roles(["Admin", "Fleet Manager"]))):
    hashed_pwd = get_password_hash(user.password)
    result = db.execute(
        text("""
            INSERT INTO users (name, email, password_hash, role_id)
            VALUES (:name, :email, :pwd, :rid)
            RETURNING *
        """),
        {"name": user.name, "email": user.email, "pwd": hashed_pwd, "rid": user.role_id}
    )
    db.commit()
    return result.fetchone()._mapping

@app.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM roles"))
    return [row._mapping for row in result]

# ==========================================
# Maintenance Logs
# ==========================================
@app.get("/maintenance", response_model=List[schemas.MaintenanceLog])
def get_maintenance_logs(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM maintenance_logs ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/maintenance", response_model=schemas.MaintenanceLog, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(
    log: schemas.MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager", "Dispatcher"]))
):
    # Verify vehicle exists
    vehicle = db.execute(text("SELECT id, status FROM vehicles WHERE id = :vid"), {"vid": log.vehicle_id}).fetchone()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if log.status == "Active":
        db.execute(text("UPDATE vehicles SET status = 'In Shop' WHERE id = :vid"), {"vid": log.vehicle_id})

    result = db.execute(
        text("""
            INSERT INTO maintenance_logs (vehicle_id, description, cost, log_date, status)
            VALUES (:vid, :desc, :cost, :date, :status)
            RETURNING *
        """),
        {"vid": log.vehicle_id, "desc": log.description, "cost": log.cost, "date": log.log_date, "status": log.status}
    )
    db.commit()
    return result.fetchone()._mapping

class MaintenanceStatusUpdate(BaseModel):
    status: str

@app.patch("/maintenance/{log_id}/status", response_model=schemas.MaintenanceLog)
def update_maintenance_status(
    log_id: int,
    status_update: MaintenanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager"]))
):
    log = db.execute(text("SELECT vehicle_id, status FROM maintenance_logs WHERE id = :id"), {"id": log_id}).fetchone()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    new_status = status_update.status
    if new_status == "Closed" and log.status == "Active":
        vehicle = db.execute(text("SELECT status FROM vehicles WHERE id = :vid"), {"vid": log.vehicle_id}).fetchone()
        if vehicle and vehicle.status != "Retired":
            db.execute(text("UPDATE vehicles SET status = 'Available' WHERE id = :vid"), {"vid": log.vehicle_id})
    
    result = db.execute(
        text("UPDATE maintenance_logs SET status = :status WHERE id = :id RETURNING *"),
        {"status": new_status, "id": log_id}
    ).fetchone()
    db.commit()
    return result._mapping

# ==========================================
# Fuel Logs & Expenses
# ==========================================
@app.get("/fuel", response_model=List[schemas.FuelLog])
def get_fuel_logs(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM fuel_logs ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/fuel", response_model=schemas.FuelLog, status_code=status.HTTP_201_CREATED)
def create_fuel_log(log: schemas.FuelLogCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(
        text("""
            INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
            VALUES (:vid, :tid, :liters, :cost, :date)
            RETURNING *
        """),
        {"vid": log.vehicle_id, "tid": log.trip_id, "liters": log.liters, "cost": log.cost, "date": log.log_date}
    )
    db.commit()
    return result.fetchone()._mapping

@app.get("/expenses", response_model=List[schemas.Expense])
def get_expenses(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(text("SELECT * FROM expenses ORDER BY id DESC"))
    return [row._mapping for row in result]

@app.post("/expenses", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = db.execute(
        text("""
            INSERT INTO expenses (vehicle_id, expense_type, cost, expense_date)
            VALUES (:vid, :etype, :cost, :date)
            RETURNING *
        """),
        {"vid": expense.vehicle_id, "etype": expense.expense_type, "cost": expense.cost, "date": expense.expense_date}
    )
    db.commit()
    return result.fetchone()._mapping

# ==========================================
# Dashboard (KPIs) & Reports
# ==========================================
@app.get("/dashboard/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    active_vehicles = db.execute(text("SELECT COUNT(*) FROM vehicles WHERE status != 'Retired'")).scalar()
    available_vehicles = db.execute(text("SELECT COUNT(*) FROM vehicles WHERE status = 'Available'")).scalar()
    in_shop = db.execute(text("SELECT COUNT(*) FROM vehicles WHERE status = 'In Shop'")).scalar()
    on_trip_vehicles = db.execute(text("SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip'")).scalar()
    active_trips = db.execute(text("SELECT COUNT(*) FROM trips WHERE status = 'Dispatched'")).scalar()
    pending_trips = db.execute(text("SELECT COUNT(*) FROM trips WHERE status = 'Draft'")).scalar()
    drivers_on_duty = db.execute(text("SELECT COUNT(*) FROM drivers WHERE status = 'On Trip'")).scalar()
    
    utilization = 0
    if active_vehicles > 0:
        utilization = round((on_trip_vehicles / active_vehicles) * 100, 1)

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": in_shop,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization": utilization,
    }

@app.get("/reports/analytics")
def get_reports_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["Admin", "Fleet Manager", "Financial Analyst"]))
):
    total_fuel_cost = db.execute(text("SELECT COALESCE(SUM(cost), 0) FROM fuel_logs")).scalar()
    total_maint_cost = db.execute(text("SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs")).scalar()
    total_expenses = db.execute(text("SELECT COALESCE(SUM(cost), 0) FROM expenses")).scalar()
    
    # Per-vehicle analytics
    vehicles = db.execute(text("SELECT * FROM vehicles")).fetchall()
    per_vehicle = []
    for v in vehicles:
        trips = db.execute(
            text("SELECT * FROM trips WHERE vehicle_id = :vid AND status = 'Completed'"),
            {"vid": v.id}
        ).fetchall()
        total_distance = sum(t.actual_distance or t.planned_distance or 0 for t in trips)
        total_fuel = db.execute(
            text("SELECT COALESCE(SUM(liters), 0) FROM fuel_logs WHERE vehicle_id = :vid"),
            {"vid": v.id}
        ).scalar()
        fuel_cost_v = db.execute(
            text("SELECT COALESCE(SUM(cost), 0) FROM fuel_logs WHERE vehicle_id = :vid"),
            {"vid": v.id}
        ).scalar()
        maint_cost_v = db.execute(
            text("SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs WHERE vehicle_id = :vid"),
            {"vid": v.id}
        ).scalar()
        revenue = sum(t.revenue or 0 for t in trips)
        op_cost = float(fuel_cost_v) + float(maint_cost_v)
        eff = round(total_distance / float(total_fuel), 2) if float(total_fuel) > 0 else 0
        roi = round((revenue - op_cost) / float(v.acquisition_cost) * 100, 1) if v.acquisition_cost else 0
        per_vehicle.append({
            "id": v.id,
            "registration_number": v.registration_number,
            "name": v.name,
            "total_distance": total_distance,
            "total_fuel_liters": float(total_fuel),
            "fuel_efficiency": eff,
            "operational_cost": op_cost,
            "revenue": revenue,
            "roi": roi,
        })

    return {
        "fuel_cost": float(total_fuel_cost),
        "maintenance_cost": float(total_maint_cost),
        "other_expenses": float(total_expenses),
        "operational_cost": float(total_fuel_cost + total_maint_cost + total_expenses),
        "per_vehicle": per_vehicle,
    }
