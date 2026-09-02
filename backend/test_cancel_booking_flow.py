"""
test_cancel_booking_flow.py
Integration test verifying:
1. Booking creation email includes cancel_url
2. Visiting cancel_url via GET renders confirmation page
3. Submitting cancellation via cancel_url marks booking Cancelled
4. Notifications are sent to both Provider and Admin
5. Cancellation reflects in database and Admin booking queries
"""
import sys
import os
import json
import random
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from database.db import get_connection
from utils.email import get_booking_confirmation_template

def run_test():
    print("=== STARTING CANCEL BOOKING INTEGRATION TEST ===")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Fetch an existing customer, provider, service
    cursor.execute("SELECT customer_id, full_name, email FROM customers WHERE status = 'Active' LIMIT 1")
    cust = cursor.fetchone()
    if not cust:
        cursor.execute("SELECT customer_id, full_name, email FROM customers LIMIT 1")
        cust = cursor.fetchone()
    assert cust, "No customer found in DB"

    cursor.execute("SELECT provider_id, COALESCE(business_name, owner_name) as provider_name FROM providers WHERE status = 'Approved' LIMIT 1")
    prov = cursor.fetchone()
    if not prov:
        cursor.execute("SELECT provider_id, COALESCE(business_name, owner_name) as provider_name FROM providers LIMIT 1")
        prov = cursor.fetchone()
    assert prov, "No provider found in DB"

    cursor.execute("SELECT service_id, service_name, estimated_price FROM services WHERE status = 'Active' LIMIT 1")
    svc = cursor.fetchone()
    assert svc, "No service found in DB"

    print(f"Customer: {cust['full_name']} (ID: {cust['customer_id']})")
    print(f"Provider: {prov['provider_name']} (ID: {prov['provider_id']})")
    print(f"Service: {svc['service_name']} (ID: {svc['service_id']})")

    # 2. Insert test booking with completion_token
    import secrets
    bk_token = secrets.token_urlsafe(32)
    bk_num = f"TEST-BK-{random.randint(10000, 99999)}"
    booking_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()

    cursor.execute("""
        INSERT INTO bookings (
            booking_number, customer_id, provider_id, service_id,
            booking_date, booking_time, service_address, city, state, pincode,
            problem_description, estimated_price, booking_status, payment_status,
            completion_token, created_at
        ) VALUES (
            %s, %s, %s, %s,
            %s, '10:00 AM', '123 Test St', 'Shirpur', 'Maharashtra', '425405',
            'Test booking for cancel flow', %s, 'Pending', 'Pending',
            %s, NOW()
        )
    """, (bk_num, cust["customer_id"], prov["provider_id"], svc["service_id"],
          booking_date, svc["estimated_price"], bk_token))
    conn.commit()

    booking_id = cursor.lastrowid
    print(f"\nCreated test booking ID {booking_id}, number {bk_num}")

    # 3. Verify email template generation
    backend_url = "https://local-service-booking-system.onrender.com"
    cancel_url = f"{backend_url}/api/customer/cancel-booking/{booking_id}?token={bk_token}"
    email_html = get_booking_confirmation_template(
        booking_number=bk_num,
        customer_name=cust["full_name"],
        provider_name=prov["provider_name"],
        service_name=svc["service_name"],
        booking_date=booking_date,
        price=svc["estimated_price"],
        status="Pending",
        cancel_url=cancel_url
    )
    assert "Cancel Booking" in email_html, "Email template missing Cancel Booking text"
    assert cancel_url in email_html, "Email template missing cancel_url"
    print("[PASS] Email template verified: contains Cancel Booking button with correct tokenized URL")

    # 4. Test Django view execution directly via RequestFactory
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django
    django.setup()
    from django.test import RequestFactory
    from route.customer import customer_cancel_booking_from_email

    rf = RequestFactory()

    # Step 4a: GET without confirm -> should return confirmation page (200 OK)
    req_get = rf.get(f"/api/customer/cancel-booking/{booking_id}?token={bk_token}")
    res_get = customer_cancel_booking_from_email(req_get, booking_id)
    assert res_get.status_code == 200, f"Expected 200, got {res_get.status_code}"
    content_get = res_get.content.decode("utf-8")
    assert f"Cancel Booking #{bk_num}" in content_get or f"#{bk_num}" in content_get, "Confirmation page missing booking number"
    assert "Confirm Cancellation" in content_get, "Confirmation page missing Confirm Cancellation button"
    print("[PASS] GET cancel confirmation page rendered successfully")

    # Step 4b: GET with invalid token -> should return Invalid Security Token error
    req_bad_token = rf.get(f"/api/customer/cancel-booking/{booking_id}?token=invalid_token_123")
    res_bad_token = customer_cancel_booking_from_email(req_bad_token, booking_id)
    content_bad = res_bad_token.content.decode("utf-8")
    assert "Invalid Security Token" in content_bad, "Invalid token page not shown"
    print("[PASS] Invalid token rejection verified")

    # Step 4c: POST with confirm and reason -> should execute cancellation
    req_post = rf.post(f"/api/customer/cancel-booking/{booking_id}", {
        "token": bk_token,
        "confirm": "1",
        "reason_select": "Change of schedule / plans",
        "reason_custom": "Automated verification test"
    })
    res_post = customer_cancel_booking_from_email(req_post, booking_id)
    assert res_post.status_code == 200, f"Expected 200 on cancel submit, got {res_post.status_code}"
    content_post = res_post.content.decode("utf-8")
    assert "Booking Cancelled" in content_post, "Cancellation success page missing expected title"
    print("[PASS] POST cancellation executed successfully")

    # 5. Verify database state
    conn.commit()
    cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
    updated_bk = cursor.fetchone()
    assert updated_bk["booking_status"] == "Cancelled", f"Expected 'Cancelled', got {updated_bk['booking_status']}"
    assert updated_bk["cancelled_by"] == "Customer", f"Expected cancelled_by 'Customer', got {updated_bk['cancelled_by']}"
    assert "Change of schedule / plans" in updated_bk["cancellation_reason"], f"Wrong reason: {updated_bk['cancellation_reason']}"
    assert updated_bk["cancelled_at"] is not None, "cancelled_at is NULL"
    print(f"[PASS] Database verified: status={updated_bk['booking_status']}, cancelled_by={updated_bk['cancelled_by']}, cancelled_at={updated_bk['cancelled_at']}")

    # 6. Verify booking_history
    cursor.execute("SELECT * FROM booking_history WHERE booking_id = %s ORDER BY changed_at DESC LIMIT 1", (booking_id,))
    hist = cursor.fetchone()
    assert hist, "No booking history record found"
    assert hist["new_status"] == "Cancelled", f"History new_status: {hist['new_status']}"
    assert hist["changed_by"] == "Customer", f"History changed_by: {hist['changed_by']}"
    print("[PASS] Booking history entry verified")

    # 7. Verify Admin Notifications
    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_type = 'Admin' AND title = 'Booking Cancelled by Customer'
        ORDER BY created_at DESC LIMIT 5
    """)
    admin_notifs = cursor.fetchall()
    assert len(admin_notifs) > 0, "No Admin notifications found for cancelled booking!"
    found_admin_notif = any(bk_num in n["message"] for n in admin_notifs)
    assert found_admin_notif, f"Admin notification for {bk_num} not found in {admin_notifs}"
    print(f"[PASS] Admin notification verified: {admin_notifs[0]['message']}")

    # 8. Verify Provider Notification
    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_type = 'Provider' AND user_id = %s AND title = 'Booking Cancelled'
        ORDER BY created_at DESC LIMIT 1
    """, (prov["provider_id"],))
    prov_notif = cursor.fetchone()
    assert prov_notif, "Provider notification not found!"
    print(f"[PASS] Provider notification verified: {prov_notif['message']}")

    # 9. Verify already-cancelled check on repeat access
    req_repeat = rf.get(f"/api/customer/cancel-booking/{booking_id}?token={bk_token}")
    res_repeat = customer_cancel_booking_from_email(req_repeat, booking_id)
    content_repeat = res_repeat.content.decode("utf-8")
    assert "Already Cancelled" in content_repeat, "Repeat cancel page missing 'Already Cancelled'"
    print("[PASS] Repeat access correctly shows 'Booking Already Cancelled'")

    # Clean up test booking
    cursor.execute("DELETE FROM booking_history WHERE booking_id = %s", (booking_id,))
    cursor.execute("DELETE FROM notifications WHERE message LIKE %s", (f"%{bk_num}%",))
    cursor.execute("DELETE FROM bookings WHERE booking_id = %s", (booking_id,))
    conn.commit()
    cursor.close()
    conn.close()
    print("[PASS] Cleaned up test data")

    print("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_test()
