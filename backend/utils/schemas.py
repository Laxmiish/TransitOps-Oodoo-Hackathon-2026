from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- Roles ---
class RoleBase(BaseModel):
    name: str

class Role(RoleBase):
    id: int
    class Config:
        from_attributes = True

# --- Users ---
class UserBase(BaseModel):
    name: str
    email: str
    role_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Vehicles ---
class VehicleBase(BaseModel):
    registration_number: str
    name: str
    model: str
    vehicle_type: Optional[str] = None
    max_load_capacity: float
    odometer: Optional[float] = 0.0
    acquisition_cost: float
    status: Optional[str] = "Available"

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: int
    class Config:
        from_attributes = True

# --- Drivers ---
class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: Optional[str] = None
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: Optional[float] = 100.0
    status: Optional[str] = "Available"

class DriverCreate(DriverBase):
    pass

class Driver(DriverBase):
    id: int
    class Config:
        from_attributes = True

# --- Trips ---
class TripBase(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: Optional[float] = None
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: Optional[float] = 0.0
    status: Optional[str] = "Draft"

class TripCreate(TripBase):
    pass

class TripStatusUpdate(BaseModel):
    status: str
    actual_distance: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: Optional[float] = None

class Trip(TripBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Maintenance Logs ---
class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    description: str
    cost: float
    log_date: date
    status: Optional[str] = "Active"

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLog(MaintenanceLogBase):
    id: int
    class Config:
        from_attributes = True

# --- Fuel Logs ---
class FuelLogBase(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    log_date: date

class FuelLogCreate(FuelLogBase):
    pass

class FuelLog(FuelLogBase):
    id: int
    class Config:
        from_attributes = True

# --- Expenses ---
class ExpenseBase(BaseModel):
    vehicle_id: int
    expense_type: str
    cost: float
    expense_date: date

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    class Config:
        from_attributes = True
