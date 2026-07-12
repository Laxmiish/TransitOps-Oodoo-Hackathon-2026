-- schema.sql
-- Database structure for TransitOps based on requirements

-- 1. Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (name) VALUES 
('Fleet Manager'), 
('Driver'), 
('Safety Officer'), 
('Financial Analyst');

-- 2. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicles
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50),
    max_load_capacity DECIMAL(10, 2) NOT NULL,
    odometer DECIMAL(10, 2) DEFAULT 0,
    acquisition_cost DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available' 
    -- Status Values: Available, On Trip, In Shop, Retired
);

-- 4. Drivers
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_category VARCHAR(50),
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(50),
    safety_score DECIMAL(5, 2) DEFAULT 100,
    status VARCHAR(50) DEFAULT 'Available' 
    -- Status Values: Available, On Trip, Off Duty, Suspended
);

-- 5. Trips
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_id INT REFERENCES vehicles(id),
    driver_id INT REFERENCES drivers(id),
    cargo_weight DECIMAL(10, 2) NOT NULL,
    planned_distance DECIMAL(10, 2),
    actual_distance DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Draft', 
    -- Status Values: Draft, Dispatched, Completed, Cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Maintenance Logs
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    log_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' 
    -- Status Values: Active, Closed
);

-- 7. Fuel Logs
CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INT REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    log_date DATE NOT NULL
);

-- 8. Expenses
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    expense_type VARCHAR(100) NOT NULL, -- e.g., Toll, Maintenance, Fuel
    cost DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL
);
