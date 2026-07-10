import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from database.db import get_connection

def setup_admin():
    print("Setting up Admins table...")
    conn = get_connection()
    cursor = conn.cursor()

    # Create Table
    create_table_query = """
    CREATE TABLE IF NOT EXISTS admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    cursor.execute(create_table_query)
    print("Table 'admins' created or already exists.")

    # Check if default admin already exists
    cursor.execute("SELECT * FROM admins WHERE email = %s", ("admin@gmail.com",))
    existing_admin = cursor.fetchone()

    # Generate bcrypt hash
    password = "admin123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Display generated SQL INSERT statement as requested by task description
    print("\n--- GENERATED SQL INSERT QUERY ---")
    print(f"INSERT INTO admins (full_name, email, password) VALUES ('System Admin', 'admin@gmail.com', '{hashed_password}');")
    print("----------------------------------\n")

    if not existing_admin:
        insert_query = """
        INSERT INTO admins (full_name, email, password)
        VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, ("System Admin", "admin@gmail.com", hashed_password))
        conn.commit()
        print("Default Admin inserted successfully.")
    else:
        print("Default Admin already exists in database.")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    setup_admin()
