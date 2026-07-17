# Database Documentation

The Local Service Booking System uses a relational schema. The Aiven Cloud MySQL database consists of 11 core tables designed to track identities, service items, bookings, notifications, reviews, and logs.

---

## Entity Relationship Summary

```
  +-----------+         +------------------+         +-----------+
  | Customers | <-----+ |     Bookings     | +-----> | Providers |
  +-----------+         +------------------+         +-----------+
        |                         |                        |
        v                         v                        v
  +---------------+     +------------------+     +--------------------+
  | Notifications |     | Booking History  |     | Provider Documents |
  +---------------+     +------------------+     +--------------------+
```

---

## Tables Dictionary

### 1. `customers`
Stores user authentication details, locations, and verification status for all customers.
* **Fields**:
  * `customer_id` (INT, Primary Key, AUTO_INCREMENT)
  * `full_name` (VARCHAR) — Customer name.
  * `email` (VARCHAR, Unique) — Customer email address.
  * `password` (VARCHAR) — Salted bcrypt hash.
  * `phone` (VARCHAR) — Contact number.
  * `gender` (VARCHAR)
  * `date_of_birth` (DATE)
  * `address`, `city`, `state`, `pincode` (VARCHAR)
  * `status` (VARCHAR) — `Active`, `Inactive`, or `Blocked`.
  * `email_verified` (TINYINT) — `1` if verified, `0` otherwise.
  * `verification_token` (VARCHAR)
  * `last_login` (DATETIME)
  * `deleted_at` (DATETIME, Nullable) — Soft delete timestamp.
  * `created_at` (DATETIME)

### 2. `providers`
Stores service provider credentials, business details, verification logs, and ratings.
* **Fields**:
  * `provider_id` (INT, Primary Key, AUTO_INCREMENT)
  * `full_name` (VARCHAR) — Provider full/business name.
  * `email` (VARCHAR, Unique)
  * `password` (VARCHAR)
  * `phone` (VARCHAR)
  * `category_id` (INT, Foreign Key -> `categories.category_id`)
  * `address`, `city`, `state`, `pincode` (VARCHAR)
  * `experience_years` (INT)
  * `description` (TEXT)
  * `average_rating` (DECIMAL(3,2)) — Calculated automatically from reviews.
  * `total_reviews` (INT)
  * `status` (VARCHAR) — `Pending` (default), `Active`, `Suspended`, or `Rejected`.
  * `email_verified` (TINYINT)
  * `verification_token` (VARCHAR)
  * `last_login` (DATETIME)
  * `deleted_at` (DATETIME, Nullable)
  * `created_at` (DATETIME)

### 3. `categories`
Organizes different service fields.
* **Fields**:
  * `category_id` (INT, Primary Key, AUTO_INCREMENT)
  * `category_name` (VARCHAR, Unique) — e.g. "Plumbing".
  * `category_icon` (VARCHAR) — Emoji or icon class name.
  * `description` (TEXT)
  * `status` (VARCHAR) — `Active` or `Inactive`.
  * `created_at` (DATETIME)

### 4. `services`
Stores predefined service items belonging to categories.
* **Fields**:
  * `service_id` (INT, Primary Key, AUTO_INCREMENT)
  * `category_id` (INT, Foreign Key -> `categories.category_id`)
  * `service_name` (VARCHAR)
  * `description` (TEXT)
  * `estimated_price` (DECIMAL(10,2))
  * `estimated_duration` (VARCHAR)
  * `status` (VARCHAR) — `Active` or `Inactive`.
  * `created_at` (DATETIME)

### 5. `provider_services`
Maps providers to their offered services and custom charges.
* **Fields**:
  * `provider_service_id` (INT, Primary Key, AUTO_INCREMENT)
  * `provider_id` (INT, Foreign Key -> `providers.provider_id`)
  * `service_id` (INT, Foreign Key -> `services.service_id`)
  * `experience_years` (INT)
  * `service_charge` (DECIMAL(10,2))
  * `is_available` (TINYINT) — `1` if currently offering, `0` otherwise.

### 6. `provider_documents`
Verification documents (ID/Licensing) submitted by providers for admin review.
* **Fields**:
  * `document_id` (INT, Primary Key, AUTO_INCREMENT)
  * `provider_id` (INT, Foreign Key -> `providers.provider_id`)
  * `document_type` (VARCHAR) — e.g., "Aadhaar", "License".
  * `file_path` (VARCHAR) — File upload URI.
  * `verification_status` (VARCHAR) — `Pending`, `Approved`, or `Rejected`.
  * `uploaded_at` (DATETIME)

### 7. `bookings`
Service contract bookings between customers and providers.
* **Fields**:
  * `booking_id` (INT, Primary Key, AUTO_INCREMENT)
  * `booking_number` (VARCHAR, Unique) — Unique tracking ID.
  * `customer_id` (INT, Foreign Key -> `customers.customer_id`)
  * `provider_id` (INT, Foreign Key -> `providers.provider_id`)
  * `service_id` (INT, Foreign Key -> `services.service_id`)
  * `booking_date` (DATE)
  * `booking_time` (VARCHAR)
  * `service_address`, `city`, `state`, `pincode` (VARCHAR)
  * `problem_description` (TEXT)
  * `estimated_price` (DECIMAL(10,2))
  * `final_price` (DECIMAL(10,2), Nullable)
  * `booking_status` (VARCHAR) — `Pending`, `Confirmed`, `Completed`, or `Cancelled`.
  * `payment_status` (VARCHAR) — `Pending`, `Paid`, or `Refunded`.
  * `cancellation_reason` (TEXT, Nullable)
  * `cancelled_by` (VARCHAR, Nullable)
  * `created_at`, `updated_at` (DATETIME)

### 8. `reviews`
Feedback and ratings posted by customers for completed service bookings.
* **Fields**:
  * `review_id` (INT, Primary Key, AUTO_INCREMENT)
  * `booking_id` (INT, Foreign Key -> `bookings.booking_id`)
  * `customer_id` (INT, Foreign Key -> `customers.customer_id`)
  * `provider_id` (INT, Foreign Key -> `providers.provider_id`)
  * `rating` (INT) — Star rating (1 to 5).
  * `review_text` (TEXT)
  * `reply_text` (TEXT, Nullable) — Provider reply response.
  * `reply_date` (DATETIME, Nullable)
  * `created_at` (DATETIME)

### 9. `notifications`
Real-time messaging alerts sent to users regarding booking updates, account activations, etc.
* **Fields**:
  * `notification_id` (INT, Primary Key, AUTO_INCREMENT)
  * `user_type` (VARCHAR) — `Customer`, `Provider`, or `Admin`.
  * `user_id` (INT, Nullable)
  * `notification_type` (VARCHAR) — `Booking`, `System`, `Alert`, or `Payment`.
  * `title` (VARCHAR)
  * `message` (TEXT)
  * `is_read` (TINYINT) — `1` if read, `0` otherwise.
  * `created_at` (DATETIME)

### 10. `refresh_tokens`
Stores JWT refresh tokens for secure session persistence.
* **Fields**:
  * `id` (INT, Primary Key, AUTO_INCREMENT)
  * `user_type` (VARCHAR) — `Customer` or `Provider`.
  * `user_id` (INT)
  * `token` (VARCHAR, Unique)
  * `expires_at` (DATETIME)
  * `created_at` (DATETIME)

### 11. `admins`
Stores system administrator credentials.
* **Fields**:
  * `admin_id` (INT, Primary Key, AUTO_INCREMENT)
  * `full_name` (VARCHAR)
  * `email` (VARCHAR, Unique)
  * `password` (VARCHAR)
  * `role` (VARCHAR) — `Super Admin` or `Admin`.
  * `created_at` (DATETIME)
