import sys
import os

# Append the workspace root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_connection

def run_upgrade():
    print("Starting database migration/upgrade...")
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Check and add columns to 'users' table
    users_columns_to_add = {
        "email_verified": "TINYINT(1) DEFAULT 0",
        "verification_token": "VARCHAR(255) DEFAULT NULL",
        "verification_token_expiry": "DATETIME DEFAULT NULL",
        "password_reset_token": "VARCHAR(255) DEFAULT NULL",
        "password_reset_expiry": "DATETIME DEFAULT NULL"
    }

    for col_name, col_def in users_columns_to_add.items():
        cursor.execute(f"SHOW COLUMNS FROM users LIKE '{col_name}'")
        exists = cursor.fetchone()
        if not exists:
            print(f"Adding column '{col_name}' to 'users' table...")
            alter_query = f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"
            cursor.execute(alter_query)
            conn.commit()
            print(f"Column '{col_name}' added successfully.")
        else:
            print(f"Column '{col_name}' already exists in 'users' table.")

    # 2. Check and add columns to 'customers' table
    cursor.execute("SHOW COLUMNS FROM customers LIKE 'deleted_at'")
    if not cursor.fetchone():
        print("Adding column 'deleted_at' to 'customers' table...")
        cursor.execute("ALTER TABLE customers ADD COLUMN deleted_at DATETIME DEFAULT NULL")
        conn.commit()

    # 3. Check and add columns to 'providers' table
    cursor.execute("SHOW COLUMNS FROM providers LIKE 'deleted_at'")
    if not cursor.fetchone():
        print("Adding column 'deleted_at' to 'providers' table...")
        cursor.execute("ALTER TABLE providers ADD COLUMN deleted_at DATETIME DEFAULT NULL")
        conn.commit()

    cursor.execute("SHOW COLUMNS FROM providers LIKE 'category_id'")
    if not cursor.fetchone():
        print("Adding column 'category_id' to 'providers' table...")
        cursor.execute("ALTER TABLE providers ADD COLUMN category_id INT DEFAULT NULL")
        conn.commit()

    # 4. Check and add columns to 'bookings' table
    cursor.execute("SHOW COLUMNS FROM bookings LIKE 'cancellation_reason'")
    if not cursor.fetchone():
        print("Adding column 'cancellation_reason' to 'bookings' table...")
        cursor.execute("ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT DEFAULT NULL")
        conn.commit()

    cursor.execute("SHOW COLUMNS FROM bookings LIKE 'cancelled_by'")
    if not cursor.fetchone():
        print("Adding column 'cancelled_by' to 'bookings' table...")
        cursor.execute("ALTER TABLE bookings ADD COLUMN cancelled_by ENUM('Customer', 'Provider', 'Admin') DEFAULT NULL")
        conn.commit()

    # 5. Standardize provider status from Suspended to Blocked
    print("Standardizing provider status values...")
    cursor.execute("UPDATE providers SET status = 'Blocked' WHERE status = 'Suspended'")
    conn.commit()

    # 6. Create 'refresh_tokens' table
    create_refresh_tokens_table = """
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )
    """
    print("Creating 'refresh_tokens' table if it does not exist...")
    cursor.execute(create_refresh_tokens_table)
    conn.commit()
    print("Table 'refresh_tokens' created or already exists.")

    # 7. Mark existing users as verified so their login functionality is not broken
    print("Marking existing users as verified...")
    cursor.execute("UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0")
    conn.commit()
    print("Existing users marked as verified successfully.")

    cursor.close()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_upgrade()

