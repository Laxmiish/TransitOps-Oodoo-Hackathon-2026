"""
init_db.py — Run this once to initialize the database.
Usage: python init_db.py

This will:
1. Create all tables (safe with IF NOT EXISTS)
2. Insert default roles  
3. Insert demo users with hashed passwords
4. Add new columns if upgrading from older schema
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://transitops_user:transitops_password@localhost:5432/transitops_db")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_PASSWORD = "password123"
hashed_pw = pwd_context.hash(DEMO_PASSWORD)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

SCHEMA = f"""
-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES 
('Admin'), ('Fleet Manager'), ('Driver'), ('Safety Officer'), ('Financial Analyst'), ('Dispatcher')
ON CONFLICT (name) DO NOTHING;

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, password_hash, role_id) VALUES
('Admin User',        'admin@transitops.io',          '{hashed_pw}', (SELECT id FROM roles WHERE name='Admin')),
('Fleet Manager',     'fleet.manager@transitops.io',   '{hashed_pw}', (SELECT id FROM roles WHERE name='Fleet Manager')),
('Alex Driver',       'driver@transitops.io',          '{hashed_pw}', (SELECT id FROM roles WHERE name='Driver')),
('Safety Officer',    'safety.officer@transitops.io',  '{hashed_pw}', (SELECT id FROM roles WHERE name='Safety Officer')),
('Financial Analyst', 'analyst@transitops.io',         '{hashed_pw}', (SELECT id FROM roles WHERE name='Financial Analyst'))
ON CONFLICT (email) DO NOTHING;

-- 3. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    max_load_capacity DECIMAL(10, 2) NOT NULL,
    odometer DECIMAL(10, 2) DEFAULT 0,
    acquisition_cost DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available'
);

-- 4. Drivers
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_category VARCHAR(50),
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(50),
    safety_score DECIMAL(5, 2) DEFAULT 100,
    status VARCHAR(50) DEFAULT 'Available'
);

-- 5. Trips
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_id INT REFERENCES vehicles(id),
    driver_id INT REFERENCES drivers(id),
    cargo_weight DECIMAL(10, 2) NOT NULL,
    planned_distance DECIMAL(10, 2),
    actual_distance DECIMAL(10, 2),
    fuel_consumed DECIMAL(10, 2),
    revenue DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if upgrading
ALTER TABLE trips ADD COLUMN IF NOT EXISTS fuel_consumed DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS revenue DECIMAL(12, 2) DEFAULT 0;

-- 6. Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    log_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active'
);

-- 7. Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    log_date DATE NOT NULL
);

-- 8. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    expense_type VARCHAR(100) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL
);
"""

with engine.connect() as conn:
    # Execute each statement separately
    for statement in SCHEMA.split(';'):
        statement = statement.strip()
        if statement:
            try:
                conn.execute(text(statement))
            except Exception as e:
                print(f"  Warning: {e}")
    conn.commit()

print("✅ Database initialized successfully!")
print(f"\n🔑 Demo accounts (password: {DEMO_PASSWORD}):")
print("  admin@transitops.io           → Admin")
print("  fleet.manager@transitops.io   → Fleet Manager")
print("  driver@transitops.io          → Driver")
print("  safety.officer@transitops.io  → Safety Officer")
print("  analyst@transitops.io         → Financial Analyst")
