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

    # 2. Create 'refresh_tokens' table
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

    # 3. Mark existing users as verified so their login functionality is not broken
    print("Marking existing users as verified...")
    cursor.execute("UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0")
    conn.commit()
    print("Existing users marked as verified successfully.")

    cursor.close()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    run_upgrade()
