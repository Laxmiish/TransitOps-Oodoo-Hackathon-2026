# TransitOps API Documentation

## 1. Authentication

### `POST /login`
*   **Description:** Authenticates a user and returns a JWT token.
*   **Expected Request (Form-Data):**
    *   `username`: string (user email)
    *   `password`: string
*   **Expected Response:** `200 OK`
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer"
    }
    ```

## 2. Vehicles

### `GET /vehicles`
*   **Description:** Retrieves all vehicles.
*   **Expected Request:** (Header: `Authorization: Bearer <token>`)
*   **Expected Response:** `200 OK`
    ```json
    [
      {
        "id": 1,
        "registration_number": "VAN-05",
        "name": "Transit Van",
        "model": "Ford Transit",
        "vehicle_type": "Van",
        "max_load_capacity": 500.0,
        "odometer": 1200.0,
        "acquisition_cost": 45000.0,
        "status": "Available"
      }
    ]
    ```

### `POST /vehicles`
*   **Description:** Creates a new vehicle (Role: Admin, Fleet Manager, Manager).
*   **Expected Request:** (JSON Body)
    ```json
    {
      "registration_number": "TRK-01",
      "name": "Heavy Truck",
      "model": "Volvo VNL",
      "max_load_capacity": 5000.0,
      "acquisition_cost": 150000.0
    }
    ```
*   **Expected Response:** `201 Created` (Returns created vehicle object)

### `PATCH /vehicles/{vehicle_id}/status`
*   **Description:** Updates vehicle status.
*   **Expected Request:**
    ```json
    {
      "status": "In Shop"
    }
    ```
*   **Expected Response:** `200 OK` (Returns updated vehicle object)

## 3. Drivers

### `GET /drivers`
*   **Description:** Retrieves all drivers.
*   **Expected Request:** None (Header: `Authorization: Bearer <token>`)
*   **Expected Response:** `200 OK` (List of driver objects)

### `POST /drivers`
*   **Description:** Registers a new driver (Role: Admin, Safety Officer, Fleet Manager).
*   **Expected Request:**
    ```json
    {
      "name": "Alex",
      "license_number": "DL-123456",
      "license_category": "Class A",
      "license_expiry_date": "2028-12-31",
      "contact_number": "+1234567890"
    }
    ```
*   **Expected Response:** `201 Created` (Returns created driver object)

## 4. Trips

### `POST /trips`
*   **Description:** Creates a new trip. Enforces validations for capacity, availability, and license expiry.
*   **Expected Request:**
    ```json
    {
      "source": "Warehouse A",
      "destination": "Store B",
      "vehicle_id": 1,
      "driver_id": 1,
      "cargo_weight": 450.0,
      "planned_distance": 120.5,
      "status": "Draft"
    }
    ```
*   **Expected Response:** `201 Created` (Returns created trip object)

### `PATCH /trips/{trip_id}/status`
*   **Description:** Updates trip status. Automatically updates corresponding driver and vehicle statuses if transitioning to "Dispatched", "Completed", or "Cancelled".
*   **Expected Request:**
    ```json
    {
      "status": "Dispatched"
    }
    ```
*   **Expected Response:** `200 OK` (Returns updated trip object)

## 5. Maintenance & Fuel

### `POST /maintenance`
*   **Description:** Logs maintenance. Automatically sets vehicle to "In Shop" if status is "Active".
*   **Expected Request:**
    ```json
    {
      "vehicle_id": 1,
      "description": "Oil Change",
      "cost": 150.0,
      "log_date": "2026-07-12",
      "status": "Active"
    }
    ```

### `POST /fuel`
*   **Description:** Logs fuel usage.
*   **Expected Request:**
    ```json
    {
      "vehicle_id": 1,
      "trip_id": 1,
      "liters": 50.0,
      "cost": 75.0,
      "log_date": "2026-07-12"
    }
    ```

## 6. Dashboards & Reports

### `GET /dashboard/kpis`
*   **Expected Response:**
    ```json
    {
        "active_vehicles": 10,
        "available_vehicles": 8,
        "vehicles_in_maintenance": 1,
        "active_trips": 1,
        "fleet_utilization": "10%"
    }
    ```

### `GET /reports/analytics` (Role: Admin, Fleet Manager, Financial Analyst)
*   **Expected Response:**
    ```json
    {
        "fuel_cost": 1500.50,
        "maintenance_cost": 500.0,
        "operational_cost": 2000.50
    }
    ```
