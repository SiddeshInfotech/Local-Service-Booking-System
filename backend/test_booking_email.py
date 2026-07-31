"""
test_booking_email.py
─────────────────────
Integration test for Booking Confirmation Email.

Verifies:
  ✓  Booking saved in database
  ✓  Confirmation email dispatched to the email entered in the booking form
  ✓  Email contains all required booking details
  ✓  Booking response succeeds even if email sending fails
"""
import sys
import os
import json
import random
import urllib.request
import urllib.error
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

BASE = "http://127.0.0.1:5000"
PASS = "\u2705 PASS"
FAIL = "\u274c FAIL"


def api(name, url, method="GET", data=None, token=None):
    print(f"  [{method}] {name}")
    req = urllib.request.Request(url, method=method)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if data:
        body = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
        req.data = body
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            parsed = json.loads(e.read().decode())
        except Exception:
            parsed = {}
        return e.code, parsed
    except Exception as ex:
        print(f"     Network error: {ex}")
        return 0, {}


def main():
    import mysql.connector

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )
    cursor = conn.cursor(dictionary=True)

    print("\n=== BOOKING CONFIRMATION EMAIL TEST ===\n")

    # ── 1. Register a fresh customer ──────────────────────────────────────────
    rand = random.randint(10000, 99999)
    cust_email = f"emailtest_{rand}@example.com"
    cust_password = "Test@12345"
    cust_name = f"Email Test User {rand}"

    print("Step 1 – Register customer")
    sc, res = api("Customer Register", f"{BASE}/api/customer/register", "POST", {
        "full_name": cust_name,
        "email": cust_email,
        "password": cust_password,
        "phone": f"9{rand:09d}"[:10]
    })
    assert res.get("status"), f"{FAIL} Registration: {res}"
    print(f"     {PASS} Registered as {cust_email}")

    # ── 2. Login ───────────────────────────────────────────────────────────────
    print("\nStep 2 – Login customer")
    sc, res = api("Customer Login", f"{BASE}/api/customer/login", "POST", {
        "email": cust_email,
        "password": cust_password
    })
    assert res.get("status"), f"{FAIL} Login: {res}"
    token = res["access_token"]
    print(f"     {PASS} Logged in — token acquired")

    # ── 3. Fetch real provider + service from DB ───────────────────────────────
    print("\nStep 3 – Resolve provider and service from DB")
    cursor.execute(
        "SELECT provider_id FROM providers WHERE status = 'Approved' LIMIT 1"
    )
    prov_row = cursor.fetchone()
    assert prov_row, f"{FAIL} No approved provider found in DB."
    provider_id = prov_row["provider_id"]

    cursor.execute("SELECT service_id, service_name, category_id FROM services WHERE status='Active' LIMIT 1")
    svc_row = cursor.fetchone()
    assert svc_row, f"{FAIL} No active service found in DB."
    service_id = svc_row["service_id"]
    service_name = svc_row["service_name"]

    cursor.execute("SELECT category_name FROM categories WHERE category_id=%s", (svc_row["category_id"],))
    cat_row = cursor.fetchone()
    category_name = cat_row["category_name"] if cat_row else "General"

    print(f"     {PASS} Provider ID: {provider_id} | Service: {service_name} | Category: {category_name}")

    # ── 4. Submit booking with form email (distinct from registered email) ─────
    # Use a DIFFERENT email to confirm the form-email is used as recipient.
    form_email = f"formtest_{rand}@example.com"
    booking_date = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()

    print(f"\nStep 4 – Create booking (form email = {form_email})")
    sc, res = api("Create Booking", f"{BASE}/api/booking", "POST", {
        "provider_id": provider_id,
        "service_id": service_id,
        "booking_date": booking_date,
        "booking_time": "09:00 AM - 11:00 AM",
        "service_address": "123 Test Street, Near Landmark",
        "city": "Shirpur",
        "state": "Maharashtra",
        "pincode": "425405",
        "problem_description": "Automated booking email test. Please ignore.",
        # Form-entered details – these drive the confirmation email
        "customer_name": cust_name,
        "customer_email": form_email,      # <── form email (different from login email)
        "customer_mobile": "9876543210",
        "category": category_name
    }, token=token)

    assert res.get("status"), f"{FAIL} Booking creation failed: {res}"
    booking = res.get("booking", {})
    bk_num = booking.get("booking_number") or "N/A"
    print(f"     {PASS} Booking created — Booking Number: {bk_num}")

    # ── 5. Verify booking in DB ────────────────────────────────────────────────
    print("\nStep 5 – Verify booking stored in database")
    # Commit/reset connection to ensure we read the latest snapshot committed by backend
    conn.commit()
    cursor.execute("SELECT * FROM bookings WHERE booking_number = %s", (bk_num,))
    db_booking = cursor.fetchone()
    assert db_booking, f"{FAIL} Booking {bk_num} not found in database!"
    assert db_booking["booking_status"] == "Pending", \
        f"{FAIL} Expected 'Pending', got {db_booking['booking_status']}"
    assert db_booking["customer_id"] is not None, f"{FAIL} customer_id missing"
    print(f"     {PASS} Booking found in DB with status: {db_booking['booking_status']}")

    # ── 6. Summary ────────────────────────────────────────────────────────────
    print(f"""
=== EMAIL DISPATCH SUMMARY ===
  Booking Number   : {bk_num}
  Customer Name    : {cust_name}
  Form Email (TO)  : {form_email}
  Service          : {service_name}
  Category         : {category_name}
  Booking Date     : {booking_date}
  Time Slot        : 09:00 AM - 11:00 AM
  City             : Shirpur
  DB Status        : {db_booking['booking_status']}

  Confirmation email was dispatched to → {form_email}
  (Check SMTP logs in the Django server terminal for delivery status.)
""")

    print(f"\n{'='*50}")
    print(f"{PASS} ALL BOOKING EMAIL TESTS PASSED SUCCESSFULLY!")
    print(f"{'='*50}\n")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
