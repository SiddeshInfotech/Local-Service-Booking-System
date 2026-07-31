# Backend Architecture & Code Documentation

The backend of the Local Service Booking System is built using Django & Django REST Framework, interacting with a remote cloud MySQL instance. Authentication is powered by JSON Web Tokens (JWT) with secure access and refresh expiration timelines.

---

## Workspace Directory Structure

```
backend/
├── database/
│   ├── db_connection.py   # Establishes remote cloud MySQL pools
│   ├── db_migration.py    # Generates base tables schema
│   └── db_upgrade.py      # Upgrades tables (indexes, constraints)
├── route/
│   ├── admin.py           # Admin dashboards and category CRUD APIs
│   ├── customer.py        # Customer profile, bookings, reviews APIs
│   ├── customer_auth.py   # Customer registration, login, verification
│   └── provider.py        # Provider registers, docs upload, schedules
├── uploads/               # Upload directory for provider certifications
├── utils/
│   ├── auth_utils.py      # JWT decorators and role validators
│   ├── mail_utils.py      # Email verification configurations
│   └── upload_utils.py    # File upload validation helpers
├── .env                   # DB credentials and secret parameters
├── manage.py              # Django management entry point
└── requirements.txt       # Project library packages list
```

---

## Core Infrastructure

### 1. Server Instantiation (`app.py`)
* Serves as the primary entry point for Flask.
* Configures global Cross-Origin Resource Sharing (CORS) rules to enable communication with the Vite React frontend on port `3000`.
* Sets up static asset routing for verifying files uploaded to `uploads/`.
* Registers the Blueprint routers:
  * `customer_auth_bp` and `customer_bp` from `route/customer.py` & `route/customer_auth.py`
  * `provider_bp` from `route/provider.py`
  * `admin_bp` from `route/admin.py`

### 2. Database Connection Pooling (`database/db_connection.py`)
* Loads database credentials from environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
* Implements a connection utility:
  ```python
  def get_connection():
      # Returns a MySQL connection instance from variables
  ```

---

## Authentication & Middleware Security

API route security is handled in `utils/auth_utils.py` using standard custom decorators.

### 1. Token Validation (`@token_required`)
Interceptors extract and decode JWT credentials from incoming request headers.
* **Header Format**:
  ```http
  Authorization: Bearer <access_token>
  ```
* **JWT Expiration Rules**:
  * Access Tokens expire in **1 hour**.
  * Refresh Tokens expire in **30 days** and are stored in the database `refresh_tokens` table for session validation.

```python
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Checks for Authorization header.
        # 2. Decodes JWT using JWT_SECRET_KEY.
        # 3. Attaches payload data (user_id, role) to request.current_user.
        # 4. Aborts with 401 Unauthorized if invalid or expired.
        return f(*args, **kwargs)
    return decorated
```

### 2. Role-Based Middleware Checks

* **`@admin_required`**:
  Verifies if the decoded user payload has role = `admin`. Aborts with `403 Forbidden` if not.
* **`@provider_required`**:
  Validates if the active role matches `provider`. Aborts with `403 Forbidden` if not.

---

## Blueprints Architecture

### 1. Customer Blueprints
* **`customer_auth_bp`**: Handles signup, signin, email verification (`/api/customer/verify-email`), forgot password, and token refreshes.
* **`customer_bp`**: Manages profile changes (`/api/customer/profile`), searching active providers, submitting bookings (`/api/booking`), and review submittals (`/api/review`).

### 2. Provider Blueprints
* **`provider_bp`**: Handles provider signups, licensing document uploads (`/api/provider/documents`), scheduling updates, and starting/completing active bookings (`/api/booking/provider/<id>/complete`).

### 3. Admin Blueprints
* **`admin_bp`**: Manages system admin authentication, category configuration CRUD, provider approval flows, blocking accounts, review moderation, and compiling aggregate commercial reports (`/api/admin/reports`).
