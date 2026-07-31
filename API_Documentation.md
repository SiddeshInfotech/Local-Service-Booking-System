# Local Service Booking System - API Documentation

This document describes all API endpoints implemented in the Django backend. All endpoints respond with JSON and use standard HTTP status codes.

---

## Base Path
- Local API Base URL: `http://127.0.0.1:5000/api`

---

## Authentication & Profiles

### 1. Customer Authentication

#### Register Customer
- **Endpoint**: `POST /customer/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "phone": "9876543210",
    "gender": "Male",
    "date_of_birth": "1995-05-15",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Customer registered successfully. Check email for verification link."
  }
  ```

#### Verify Email
- **Endpoint**: `GET /customer/verify-email?token=<token>` or `POST /customer/verify-email`
- **Request Body (for POST)**:
  ```json
  {
    "token": "verification_token_here"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Email verified successfully."
  }
  ```

#### Login Customer
- **Endpoint**: `POST /customer/login`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Login successful.",
    "access_token": "jwt_access_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "customer_id": 1,
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  }
  ```

#### Refresh Token
- **Endpoint**: `POST /customer/refresh-token`
- **Request Body**:
  ```json
  {
    "refresh_token": "refresh_token_here"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Token refreshed successfully.",
    "access_token": "new_jwt_access_token_here"
  }
  ```

#### Logout Customer
- **Endpoint**: `POST /customer/logout`
- **Request Body**:
  ```json
  {
    "refresh_token": "refresh_token_here"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Logged out successfully."
  }
  ```

---

### 2. Customer Profile
*Requires `Authorization: Bearer <token>` and `Customer` role.*

#### Get Profile
- **Endpoint**: `GET /customer/profile`
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Profile fetched successfully.",
    "customer": {
      "customer_id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "gender": "Male",
      "date_of_birth": "1995-05-15",
      "profile_image": null,
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "status": "Active",
      "email_verified": 1,
      "created_at": "2026-07-12T06:06:56"
    }
  }
  ```

#### Update Profile
- **Endpoint**: `PUT /customer/profile`
- **Request Body** (optional updates):
  ```json
  {
    "full_name": "John Updated",
    "phone": "9999988888",
    "address": "456 Side Street"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Profile updated successfully.",
    "customer": { ... }
  }
  ```

---

### 3. Provider Authentication

#### Register Provider
- **Endpoint**: `POST /provider/register`
- **Request Body**:
  ```json
  {
    "full_name": "Jane Service",
    "email": "jane@example.com",
    "password": "Password123",
    "phone": "8888877777",
    "address": "456 Business Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "experience_years": 5,
    "description": "Expert home maintenance and repair services."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Provider registered successfully. Check email for verification link."
  }
  ```

#### Login Provider
- **Endpoint**: `POST /provider/login`
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Login successful.",
    "access_token": "jwt_access_token",
    "refresh_token": "refresh_token"
  }
  ```

---

### 4. Provider Profile & Credentials
*Requires `Authorization: Bearer <token>` and `Provider` role.*

#### Get Profile
- **Endpoint**: `GET /provider/profile`
- **Response (200 OK)**: Contains provider details along with a `"documents"` array showing verification status.

#### Update Profile
- **Endpoint**: `PUT /provider/profile`

#### Upload Document
- **Endpoint**: `POST /provider/documents`
- **Headers**: `Content-Type: multipart/form-data`
- **Body parameters**:
  - `document_type`: "Aadhaar", "PAN", "License", "Profile Photo", or "Certificate"
  - `document_file`: [binary file upload]
- **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Document uploaded successfully.",
    "document": {
      "document_id": 1,
      "document_type": "Aadhaar",
      "file_path": "uploads/some_unique_filename.jpg",
      "verification_status": "Pending"
    }
  }
  ```

---

### 5. Admin Authentication

#### Login Admin
- **Endpoint**: `POST /admin/login`
- **Request Body**:
  ```json
  {
    "email": "admin@localservice.com",
    "password": "admin123"
  }
  ```
- **Response (200 OK)**: Returns standard login object with `"role": "Super Admin"` or `"Admin"`.

---

## Category & Service Management

### Category
- **Get Active Categories**: `GET /category` (Public)
- **Create Category**: `POST /category` (Admin only)
- **Update Category**: `PUT /category/<category_id>` (Admin only)
- **Delete/Deactivate Category**: `DELETE /category/<category_id>` (Admin only)

### Service
- **Get Active Services**: `GET /service?category_id=<id>` (Public, optional filter)
- **Create Service**: `POST /service` (Admin only)
- **Update Service**: `PUT /service/<service_id>` (Admin only)
- **Delete/Deactivate Service**: `DELETE /service/<service_id>` (Admin only)

### Provider Services Mapping
- **Link Service**: `POST /service/provider` (Provider only)
  - Request: `{"service_id": 1, "experience_years": 3, "service_charge": 500.00}`
- **List Linked Services**: `GET /service/provider` (Provider only)
- **Unlink Service**: `DELETE /service/provider/<service_id>` (Provider only)

---

## Booking Module

### Customer Bookings
- **Create Booking**: `POST /booking` (Customer only)
  - Request:
    ```json
    {
      "provider_id": 1,
      "service_id": 1,
      "booking_date": "2026-07-15",
      "booking_time": "14:30",
      "service_address": "Flat 302, Mumbai",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "problem_description": "Faucet leaking heavily."
    }
    ```
- **Booking History**: `GET /booking/history` (Customer only)
- **Cancel Booking**: `POST /booking/<booking_id>/cancel` (Customer only)
  - Request: `{"reason": "Wrong timing"}`

### Provider Bookings
- **Get Provider Bookings**: `GET /booking/provider/history` (Provider only)
- **Accept Request**: `POST /booking/provider/<booking_id>/accept` (Provider only)
- **Reject Request**: `POST /booking/provider/<booking_id>/reject` (Provider only)
- **Start Work**: `POST /booking/provider/<booking_id>/start` (Provider only)
- **Complete Work**: `POST /booking/provider/<booking_id>/complete` (Provider only)
  - Request: `{"final_price": 500.00}` (Optional)
- **Cancel Booking**: `POST /booking/provider/<booking_id>/cancel` (Provider only)
  - Request: `{"reason": "Parts unavailable"}`

---

## Reviews

- **Post Review**: `POST /review` (Customer only, for completed bookings)
  - Request: `{"booking_id": 1, "rating": 5, "review_text": "Excellent service!"}`
- **Reply to Review**: `POST /review/<review_id>/reply` (Provider only)
  - Request: `{"reply_text": "Thank you for your feedback!"}`
- **Get Provider Reviews**: `GET /review/provider/<provider_id>` (Public)

---

## Payments

- **Create Payment**: `POST /payment/create` (Updates payment status to 'Paid')
  - Request: `{"booking_id": 1}`
- **Check Status**: `GET /payment/<booking_id>/status`
- **Refund Payment**: `POST /payment/<booking_id>/refund` (Admin only)
- **Get Payment History**: `GET /payment/history` (Retrieves lists of paid/refunded jobs)

---

## Notifications

- **List Alerts**: `GET /notification` (Role targeted)
- **Mark Alert Read**: `PUT /notification/<notification_id>/read`

---

## Admin Operations

- **Approve Provider**: `POST /admin/provider/<provider_id>/approve`
- **Reject Provider**: `POST /admin/provider/<provider_id>/reject`
- **Suspend Provider**: `POST /admin/provider/<provider_id>/suspend`
- **Suspend Customer**: `POST /admin/customer/<customer_id>/suspend`
- **Dashboard Stats**: `GET /admin/stats`
- **View Aggregate Reports**: `GET /admin/reports`
- **Audit Booking Logs**: `GET /admin/activity-logs`
