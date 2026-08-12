import sys
import os

# Append the workspace root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import get_connection

def delete_data():
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Delete services
        services_to_delete = ['plum', 'Test Service 100', 'Test Service 999']
        format_strings = ','.join(['%s'] * len(services_to_delete))
        cursor.execute(f"DELETE FROM services WHERE service_name IN ({format_strings})", tuple(services_to_delete))
        print(f"Deleted {cursor.rowcount} services.")

        # Delete categories
        categories_to_delete = ['New Service', 'Plumbing 2', 'Water Pump', 'Electrician 2']
        format_strings_cat = ','.join(['%s'] * len(categories_to_delete))
        cursor.execute(f"DELETE FROM categories WHERE category_name IN ({format_strings_cat})", tuple(categories_to_delete))
        print(f"Deleted {cursor.rowcount} categories.")

        conn.commit()
        print("Data deletion committed successfully.")
    except Exception as e:
        print(f"Error during deletion: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    delete_data()
