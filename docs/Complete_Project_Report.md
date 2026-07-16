# Complete Project Report - Local Service Booking System

## Executive Summary
The Local Service Booking System is a full-stack platform built to connect local service providers (plumbers, electricians, carpenters, AC technicians, cleaning staff) with customers in their area. It provides a client portal with service discovery and online bookings, alongside an administration panel for system moderators to oversee users, moderate comments, configure categories, audit listings, and analyze revenue metrics.

---

## 1. Technology Stack

### Backend API Layer
* **Core Framework**: Python Flask (REST API)
* **Authentication**: JSON Web Tokens (PyJWT)
* **Database**: MySQL (hosted on Aiven Cloud)
* **CORS Middleware**: Flask-CORS
* **Cryptography**: Bcrypt password hashing

### Frontend UI Layer
* **Core Framework**: React (Single Page Application via Vite)
* **Styling**: Vanilla CSS with Tailwind CSS utilities
* **State Management**: React Context, React Hooks (`useState`, `useEffect`, `useRef`)
* **Icons Library**: Lucide React
* **Router Routing**: React Router DOM (nested secure routers)

---

## 2. Platform Core Features

### 1. Unified Authentication Portals
* Role-based signup & login portals for Customers, Providers, and Administrators.
* Secure token generation:
  * Short-lived access token (JWT) attached to request headers.
  * Long-lived refresh token stored in `refresh_tokens` database table for automated silent re-authentication.

### 2. Customer Services Catalog & Booking Checkouts
* Dynamic categorizations fetched from Aiven MySQL categories database.
* Grid layout displaying available pre-vetted services.
* Integrated scheduling form:
  * Auto-populates customer details.
  * Selects slot timings and date.
  * Allocates an approved provider in the target city and category automatically.
  * Writes booking contracts to database as `Pending`.

### 3. Provider Management & Moderation
* Provider signups register as `Pending` status.
* Providers upload Aadhaar, PAN, and licensing documentations.
* Document inspection drawer allows administrators to approve, reject, or suspend accounts.
* Approved accounts dynamically move to active listings.

### 4. Admin Management Dashboard & Operations
* Real-time statistics cards compiling total bookings, customers counts, providers, and revenue values.
* Custom category CRUD tools.
* Service item creation & configuration, including base charges and deactivations.
* Dynamic diagnostic charts displaying booking traffic and category revenue divisions.
* Activity logs logs for moderator reviews.

---

## 3. Deployment & Setup Guidelines
Refer to [Installation_Guide.md](file:///d:/Local-Service-Booking-System/docs/Installation_Guide.md) for step-by-step setup guides, database migration parameters, `.env` file templates, and execution commands.
All APIs can be verified using the Postman Collection: [Local_Service_Booking_API.postman_collection.json](file:///d:/Local-Service-Booking-System/Local_Service_Booking_API.postman_collection.json).
All test results can be verified in [Final_Test_Report.md](file:///d:/Local-Service-Booking-System/docs/Final_Test_Report.md).
