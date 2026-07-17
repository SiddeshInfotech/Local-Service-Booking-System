"""
Quick helper: marks ALL users as email_verified = 1 in the database.
Run this once to allow login without email verification during development.

Usage:  python verify_all_users.py
"""
import sys
import os

# Make sure the parent directory is on the path so config/database imports work
sys.path.insert(0, os.path.dirname(__file__))

from database.db import get_connection

def verify_all_users():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Count unverified users first
        cursor.execute("SELECT COUNT(*) FROM users WHERE email_verified = 0 OR email_verified IS NULL")
        count = cursor.fetchone()[0]

        if count == 0:
            print("✅  All users are already verified. No changes needed.")
            cursor.close()
            conn.close()
            return

        # Mark all users as verified
        cursor.execute("UPDATE users SET email_verified = 1 WHERE email_verified = 0 OR email_verified IS NULL")
        conn.commit()

        print(f"✅  Successfully verified {cursor.rowcount} user(s).")
        print("    You can now log in with any registered account.")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌  Error: {e}")
        print("\nMake sure:")
        print("  1. MySQL is running")
        print("  2. DB credentials in config.py / .env are correct")
        print("  3. The 'local_service_db' database and 'users' table exist")

if __name__ == "__main__":
    verify_all_users()
