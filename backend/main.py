from fastapi import FastAPI, status, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from .utils import schemas
from .utils.database import get_db

app = FastAPI(
    title="TransitOps API Gateway",
    description="Main entrypoint with skeleton routes."
)

@app.get("/")
def root():
    return {"message": "Welcome to TransitOps API"}

# ==========================================
# Authentication (Login)
# ==========================================
# Using FastAPI's built-in OAuth2 standard for secure logins.
# This expects a username (email) and password in the request body.
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Skeleton logic:
    # 1. Query the database for the user by email (form_data.username)
    # 2. Verify the hashed password
    # 3. Generate and return a JWT access token with the user's role_id for RBAC
    pass

# ==========================================
# Vehicles
# ==========================================
@app.get("/vehicles", response_model=List[schemas.Vehicle])
def get_vehicles(db: Session = Depends(get_db)):
    # Example of how to use the database connection pool to execute a query:
    # `db.execute` runs the query using one of the borrowed connections.
    result = db.execute(text("SELECT * FROM vehicles"))
    
    # We map the raw SQL result into a list of dictionaries so FastAPI/Pydantic can return it.
    vehicles = [row._mapping for row in result]
    return vehicles

@app.post("/vehicles", response_model=schemas.Vehicle, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: schemas.VehicleCreate):
    pass

@app.get("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def get_vehicle(vehicle_id: int):
    pass

@app.patch("/vehicles/{vehicle_id}/status", response_model=schemas.Vehicle)
def update_vehicle_status(vehicle_id: int, status: str):
    pass

# ==========================================
# Drivers
# ==========================================
@app.get("/drivers", response_model=List[schemas.Driver])
def get_drivers():
    pass

@app.post("/drivers", response_model=schemas.Driver, status_code=status.HTTP_201_CREATED)
def create_driver(driver: schemas.DriverCreate):
    pass

@app.get("/drivers/{driver_id}", response_model=schemas.Driver)
def get_driver(driver_id: int):
    pass

# ==========================================
# Trips
# ==========================================
@app.get("/trips", response_model=List[schemas.Trip])
def get_trips():
    pass

@app.post("/trips", response_model=schemas.Trip, status_code=status.HTTP_201_CREATED)
def create_trip(trip: schemas.TripCreate):
    pass

@app.get("/trips/{trip_id}", response_model=schemas.Trip)
def get_trip(trip_id: int):
    pass

@app.patch("/trips/{trip_id}/status", response_model=schemas.Trip)
def update_trip_status(trip_id: int, trip_status: schemas.TripStatusUpdate):
    pass

# ==========================================
# Users & Roles
# ==========================================
@app.get("/users", response_model=List[schemas.User])
def get_users():
    pass

@app.post("/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate):
    pass

# ==========================================
# Maintenance Logs
# ==========================================
@app.get("/maintenance", response_model=List[schemas.MaintenanceLog])
def get_maintenance_logs():
    pass

@app.post("/maintenance", response_model=schemas.MaintenanceLog, status_code=status.HTTP_201_CREATED)
def create_maintenance_log(log: schemas.MaintenanceLogCreate):
    pass

# ==========================================
# Fuel Logs
# ==========================================
@app.get("/fuel", response_model=List[schemas.FuelLog])
def get_fuel_logs():
    pass

@app.post("/fuel", response_model=schemas.FuelLog, status_code=status.HTTP_201_CREATED)
def create_fuel_log(log: schemas.FuelLogCreate):
    pass

# ==========================================
# Expenses
# ==========================================
@app.get("/expenses", response_model=List[schemas.Expense])
def get_expenses():
    pass

@app.post("/expenses", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
def create_expense(expense: schemas.ExpenseCreate):
    pass
