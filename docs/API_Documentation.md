# Local Service Booking System - API Documentation

This document describes all API endpoints implemented in the Flask backend. All endpoints respond with JSON and use standard HTTP status codes.

## Base Path
- Local Base URL: `http://127.0.0.1:5000`

---

## Authentication & Authorization

All authenticated endpoints expect the following header:
```http
Authorization: Bearer <access_token>
```
Depending on the route prefix or middleware, the token must belong to a user with the corresponding role (`customer`, `provider`, or `admin`).

---

## 1. Customer Authentication & Profile

### Register Customer
* **Method**: `POST`
* **Endpoint**: `/api/customer/register`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "full_name": "Bob Customer",
    "email": "bob_cust_test@example.com",
    "password": "TestPass123!",
    "phone": "9822222230"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Customer registered successfully. Check email for verification link."
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "status": false,
    "message": "Email already exists."
  }
  ```

### Verify Email
* **Method**: `POST`
* **Endpoint**: `/api/customer/verify-email`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "token": "verification_token_here"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Email verified successfully."
  }
  ```

### Login Customer
* **Method**: `POST`
* **Endpoint**: `/api/customer/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "bob_cust_test@example.com",
    "password": "TestPass123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Login successful.",
    "access_token": "jwt_access_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "customer_id": 1,
      "full_name": "Bob Customer",
      "email": "bob_cust_test@example.com"
    }
  }
  ```

### Refresh Token
* **Method**: `POST`
* **Endpoint**: `/api/customer/refresh-token`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "refresh_token": "refresh_token_here"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Token refreshed successfully.",
    "access_token": "new_jwt_access_token_here"
  }
  ```

### Get Customer Profile
* **Method**: `GET`
* **Endpoint**: `/api/customer/profile`
* **Headers**: `Authorization: Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "customer": {
      "customer_id": 1,
      "full_name": "Bob Customer",
      "email": "bob_cust_test@example.com",
      "phone": "9822222230",
      "gender": "Male",
      "address": "123 Main St",
      "city": "Nashik",
      "state": "Maharashtra",
      "pincode": "422001",
      "status": "Active",
      "email_verified": 1
    }
  }
  ```

---

## 2. Provider Authentication & Credentials

### Register Provider
* **Method**: `POST`
* **Endpoint**: `/api/provider/register`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "full_name": "Alice Electrician",
    "phone": "9811111230",
    "email": "alice_elec_test@example.com",
    "password": "TestPass123!",
    "city": "Nashik",
    "service": "Electrician",
    "experience": "5",
    "description": "Expert electrical work"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Provider registered successfully. Check email for verification link."
  }
  ```

### Login Provider
* **Method**: `POST`
* **Endpoint**: `/api/provider/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "alice_elec_test@example.com",
    "password": "TestPass123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Login successful.",
    "access_token": "jwt_access_token_here",
    "refresh_token": "refresh_token_here"
  }
  ```

### Upload Verification Document
* **Method**: `POST`
* **Endpoint**: `/api/provider/documents`
* **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: multipart/form-data`
* **Request Body (form-data)**:
  * `document_file`: [file binary]
  * `document_type`: "Aadhaar" (or "PAN", "License")
* **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Document uploaded successfully.",
    "document": {
      "document_id": 5,
      "document_type": "Aadhaar",
      "file_path": "uploads/document_123.jpg",
      "verification_status": "Pending"
    }
  }
  ```

---

## 3. Public Service & Category Listings

### Get Active Categories
* **Method**: `GET`
* **Endpoint**: `/api/category`
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "categories": [
      {
        "category_id": 1,
        "category_name": "Cleaning",
        "category_icon": "🧹",
        "description": "Home deep cleaning services."
      }
    ]
  }
  ```

### Get Active Services
* **Method**: `GET`
* **Endpoint**: `/api/service`
* **Query Parameters**: `category_id` (optional filter)
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "services": [
      {
        "service_id": 1,
        "category_id": 1,
        "service_name": "Pipe Leak Repair",
        "estimated_price": 499.00,
        "estimated_duration": "1-2 hrs"
      }
    ]
  }
  ```

---

## 4. Bookings & Reviews

### Create Booking (Customer)
* **Method**: `POST`
* **Endpoint**: `/api/booking`
* **Headers**: `Authorization: Bearer <customer_token>`
* **Request Body**:
  ```json
  {
    "provider_id": 1,
    "service_id": 1,
    "booking_date": "2026-08-01",
    "booking_time": "10:00 AM - 01:00 PM",
    "service_address": "456 Oak Lane",
    "city": "Nashik",
    "state": "Maharashtra",
    "pincode": "422001",
    "problem_description": "Need full wiring repair"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Booking request created successfully.",
    "booking_id": 10
  }
  ```

### Cancel Booking (Customer)
* **Method**: `POST`
* **Endpoint**: `/api/booking/<booking_id>/cancel`
* **Headers**: `Authorization: Bearer <customer_token>`
* **Request Body**:
  ```json
  {
    "reason": "Timing issues"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Booking cancelled successfully."
  }
  ```

### Submit Review (Customer)
* **Method**: `POST`
* **Endpoint**: `/api/review`
* **Headers**: `Authorization: Bearer <customer_token>`
* **Request Body**:
  ```json
  {
    "booking_id": 1,
    "rating": 5,
    "review_text": "Excellent service!"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "status": true,
    "message": "Review submitted successfully."
  }
  ```

---

## 5. Admin Panel Endpoints

### Login Admin
* **Method**: `POST`
* **Endpoint**: `/api/admin/login`
* **Request Body**:
  ```json
  {
    "email": "admin@gmail.com",
    "password": "admin123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "access_token": "admin_jwt_token",
    "refresh_token": "admin_refresh_token",
    "admin": {
      "admin_id": 1,
      "full_name": "System Admin",
      "role": "Super Admin"
    }
  }
  ```

### Get Dashboard Stats
* **Method**: `GET`
* **Endpoint**: `/api/admin/stats`
* **Headers**: `Authorization: Bearer <admin_token>`
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "stats": {
      "total_customers": 15,
      "total_providers": 8,
      "pending_providers": 2,
      "total_bookings": 42,
      "total_revenue": 18500.00
    }
  }
  ```

### Approve Provider Listing
* **Method**: `POST`
* **Endpoint**: `/api/admin/provider/<provider_id>/approve`
* **Headers**: `Authorization: Bearer <admin_token>`
* **Response (200 OK)**:
  ```json
  {
    "status": true,
    "message": "Provider account has been approved and activated."
  }
  ```
