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


-- -------------------------------------------------------
-- Done. Run: SOURCE migration.sql; inside MySQL CLI
-- or import via phpMyAdmin / Aiven Console.
-- -------------------------------------------------------
SELECT 'Migration complete!' as result;
