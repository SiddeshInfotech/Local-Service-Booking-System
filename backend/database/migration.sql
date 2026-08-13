-- ============================================================
-- migration.sql — Local Service Booking System
-- Run this file once against your MySQL database to safely
-- add missing columns and standardize status values.
-- ============================================================

-- -------------------------------------------------------
-- 1. Add deleted_at column to customers (if not exists)
-- -------------------------------------------------------
SET @exist_cust_deleted := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customers'
      AND COLUMN_NAME = 'deleted_at'
);

SET @sql_cust := IF(@exist_cust_deleted = 0,
    'ALTER TABLE customers ADD COLUMN deleted_at DATETIME DEFAULT NULL',
    'SELECT "deleted_at already exists in customers"'
);
PREPARE stmt FROM @sql_cust;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- -------------------------------------------------------
-- 2. Add deleted_at column to providers (if not exists)
-- -------------------------------------------------------
SET @exist_prov_deleted := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'providers'
      AND COLUMN_NAME = 'deleted_at'
);

SET @sql_prov := IF(@exist_prov_deleted = 0,
    'ALTER TABLE providers ADD COLUMN deleted_at DATETIME DEFAULT NULL',
    'SELECT "deleted_at already exists in providers"'
);
PREPARE stmt FROM @sql_prov;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- -------------------------------------------------------
-- 3. Add category_id to providers (if not exists)
-- -------------------------------------------------------
SET @exist_prov_cat := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'providers'
      AND COLUMN_NAME = 'category_id'
);

SET @sql_prov_cat := IF(@exist_prov_cat = 0,
    'ALTER TABLE providers ADD COLUMN category_id INT DEFAULT NULL',
    'SELECT "category_id already exists in providers"'
);
PREPARE stmt FROM @sql_prov_cat;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- -------------------------------------------------------
-- 4. Standardize provider status: 'Suspended' -> 'Blocked'
--    This ensures all existing data is consistent with the
--    updated backend and frontend expectations.
-- -------------------------------------------------------
UPDATE providers SET status = 'Blocked' WHERE status = 'Suspended';


-- -------------------------------------------------------
-- 5. Add cancellation fields to bookings (if not exists)
-- -------------------------------------------------------
SET @exist_cancel_reason := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'cancellation_reason'
);

SET @sql_cancel_reason := IF(@exist_cancel_reason = 0,
    'ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT DEFAULT NULL',
    'SELECT "cancellation_reason already exists in bookings"'
);
PREPARE stmt FROM @sql_cancel_reason;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @exist_cancelled_by := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'cancelled_by'
);

SET @sql_cancelled_by := IF(@exist_cancelled_by = 0,
    "ALTER TABLE bookings ADD COLUMN cancelled_by ENUM('Customer', 'Provider', 'Admin') DEFAULT NULL",
    'SELECT "cancelled_by already exists in bookings"'
);
PREPARE stmt FROM @sql_cancelled_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @exist_completed_by := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'completed_by'
);
SET @sql_completed_by := IF(@exist_completed_by = 0,
    "ALTER TABLE bookings ADD COLUMN completed_by ENUM('customer', 'provider') DEFAULT NULL",
    'SELECT "completed_by already exists in bookings"'
);
PREPARE stmt FROM @sql_completed_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @exist_review_title := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'reviews'
      AND COLUMN_NAME = 'review_title'
);
SET @sql_review_title := IF(@exist_review_title = 0,
    "ALTER TABLE reviews ADD COLUMN review_title VARCHAR(255) DEFAULT NULL",
    'SELECT "review_title already exists in reviews"'
);
PREPARE stmt FROM @sql_review_title;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


SET @exist_profile_photo := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'customers'
      AND COLUMN_NAME = 'profile_photo'
);
SET @sql_profile_photo := IF(@exist_profile_photo = 0,
    "ALTER TABLE customers ADD COLUMN profile_photo VARCHAR(255) DEFAULT NULL",
    'SELECT "profile_photo already exists in customers"'
);
PREPARE stmt FROM @sql_profile_photo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- redfining provider status to support Blocked if needed
ALTER TABLE providers MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Suspended', 'Blocked') DEFAULT 'Pending';
UPDATE providers SET status = 'Blocked' WHERE status = 'Suspended';


ALTER TABLE bookings ADD COLUMN customer_confirmed TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN review_given TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN completion_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN completed_at DATETIME DEFAULT NULL;

-- -------------------------------------------------------
-- 6. Ensure positive price check constraints on services
-- -------------------------------------------------------
UPDATE services SET estimated_price = 1.00 WHERE estimated_price IS NULL OR estimated_price <= 0;
UPDATE provider_services SET service_charge = 1.00 WHERE service_charge IS NULL OR service_charge <= 0;

ALTER TABLE services ADD CONSTRAINT chk_service_price_gt_zero CHECK (estimated_price > 0);
ALTER TABLE provider_services ADD CONSTRAINT chk_provider_service_charge_gt_zero CHECK (service_charge > 0);

-- -------------------------------------------------------
-- Done. Run: SOURCE migration.sql; inside MySQL CLI
-- or import via phpMyAdmin / Aiven Console.
-- -------------------------------------------------------
SELECT 'Migration complete!' as result;


