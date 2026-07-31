from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from utils.compat import jsonify, get_json_data, get_current_user
from database.db import get_connection
import bcrypt
import datetime
import os
import secrets
import random
from utils.email import (
    send_email,
    send_email_detailed,
    send_email_async,
    get_otp_email_template,
    get_password_reset_template,
    get_booking_confirmation_template,
    get_booking_completed_template,
    get_review_request_template
)
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)


# ====================================================
# CUSTOMER AUTHENTICATION
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_customer(request):
    try:
        data = get_json_data(request)
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")
        gender = data.get("gender")
        date_of_birth = data.get("date_of_birth")
        address = data.get("address")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")

        if not full_name or not email or not password:
            return jsonify({
                "status": False,
                "message": "Full Name, Email and Password are required."
            }, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check duplicate email
        cursor.execute("SELECT customer_id FROM customers WHERE email=%s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email already exists."}, status=409)

        # Check duplicate phone
        if phone:
            cursor.execute("SELECT customer_id FROM customers WHERE phone=%s", (phone,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": "Phone number already registered."}, status=400)

        # Hash Password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cust_status = "Active"
        cust_email_verified = 1

        # Insert Customer
        query = """
        INSERT INTO customers
        (full_name, email, password_hash, phone, gender, date_of_birth, address, city, state, pincode, status, email_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (full_name, email, hashed_password, phone, gender, date_of_birth, address, city, state, pincode, cust_status, cust_email_verified))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Customer registered successfully."
        }, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def verify_customer_email(request):
    try:
        token = None
        if request.method == "POST":
            data = get_json_data(request)
            token = data.get("token")
        else:
            token = request.GET.get("token")

        if not token:
            return jsonify({"status": False, "message": "Verification token is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT email, expires_at FROM email_verification_tokens WHERE verification_token = %s AND verified = 0 LIMIT 1",
            (token,)
        )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email verification token."}, status=400)

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email verification token has expired."}, status=400)

        # Mark token as verified
        cursor.execute(
            "UPDATE email_verification_tokens SET verified = 1 WHERE verification_token = %s",
            (token,)
        )
        # Verify customer
        cursor.execute(
            "UPDATE customers SET email_verified = 1 WHERE email = %s",
            (token_record["email"],)
        )
        conn.commit()

        cursor.close()
        conn.close()

        if request.method == "POST":
            return jsonify({"status": True, "message": "Email verified successfully."}, status=200)
        else:
            frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
            return redirect(f"{frontend_url}/email-verified")

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_customer(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"status": False, "message": "Email and Password are required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customers WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "User not found."}, status=404)

        # Only block suspended customers
        if user["status"] == "Blocked":
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Your account has been suspended."
            }, status=403)

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Invalid Password."
            }, status=401)

        access_token = generate_access_token(
            user["customer_id"],
            user["email"],
            "customer"
        )

        refresh_token = generate_and_save_refresh_token(
            user["customer_id"],
            "customer"
        )

        cursor.execute(
            "UPDATE customers SET last_login = NOW() WHERE customer_id = %s",
            (user["customer_id"],)
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token": access_token,
            "user": {
                "customer_id": user["customer_id"],
                "full_name": user["full_name"],
                "email": user["email"]
            }
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()

        return jsonify({
            "status": False,
            "message": f"Server Error: {str(e)}"
        }, status=500)
@api_view(["POST"])
@permission_classes([AllowAny])
def customer_forgot_password(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        if not email:
            return jsonify({"status": False, "message": "Email is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT customer_id, full_name FROM customers WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email not found."}, status=404)

        # Generate Secure 6 Digit OTP
        import random
        otp_code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

        # Store OTP inside password_reset_tokens
        cursor.execute(
            "INSERT INTO password_reset_tokens (email, otp_code, expires_at, used) VALUES (%s, %s, %s, 0)",
            (email, otp_code, expires_at)
        )
        conn.commit()

        # Send OTP via SMTP
        email_subject = "Your Password Reset OTP | Fixora"
        email_body = get_otp_email_template(user['full_name'], otp_code)
        
        email_success, email_msg = send_email_detailed(email, email_subject, email_body)

        cursor.close()
        conn.close()

        if not email_success:
            return jsonify({
                "status": False,
                "message": f"OTP generated, but email delivery failed: {email_msg}"
            }, status=500)

        return jsonify({"status": True, "message": "OTP sent successfully to your registered email address."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_verify_otp(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        # Accept both 'otp_code' and 'otp' as field names
        otp_code = data.get("otp_code") or data.get("otp")

        if not otp_code:
            return jsonify({"status": False, "message": "OTP code is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # If email provided, verify with both; otherwise look up via OTP alone
        if email:
            cursor.execute(
                "SELECT email, expires_at FROM password_reset_tokens WHERE email = %s AND otp_code = %s AND used = 0 LIMIT 1",
                (email, otp_code)
            )
        else:
            cursor.execute(
                "SELECT email, expires_at FROM password_reset_tokens WHERE otp_code = %s AND used = 0 LIMIT 1",
                (otp_code,)
            )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid OTP code."}, status=400)

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "OTP code has expired."}, status=400)

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "OTP verified successfully.", "email": token_record["email"]}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_reset_password(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        # Accept both 'otp_code' and 'otp' as field names
        otp_code = data.get("otp_code") or data.get("otp")
        new_password = data.get("new_password")

        if not otp_code or not new_password:
            return jsonify({"status": False, "message": "OTP code and new password are required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # If email provided, verify with both; otherwise look up via OTP alone
        if email:
            cursor.execute(
                "SELECT email, expires_at FROM password_reset_tokens WHERE email = %s AND otp_code = %s AND used = 0 LIMIT 1",
                (email, otp_code)
            )
        else:
            cursor.execute(
                "SELECT email, expires_at FROM password_reset_tokens WHERE otp_code = %s AND used = 0 LIMIT 1",
                (otp_code,)
            )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid OTP code or request."}, status=400)

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "OTP code has expired."}, status=400)

        # Resolve email from token (handles case where email was not passed by frontend)
        email = token_record["email"]

        # Hash new password with bcrypt
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Update customer password
        cursor.execute(
            "UPDATE customers SET password_hash = %s WHERE email = %s",
            (hashed_password, email)
        )
        # Mark token as used
        cursor.execute(
            "UPDATE password_reset_tokens SET used = 1 WHERE email = %s AND otp_code = %s",
            (email, otp_code)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Password reset successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_refresh_token(request):
    try:
        data = get_json_data(request)
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return jsonify({"status": False, "message": "Refresh token is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT customer_id, expires_at, revoked FROM refresh_tokens WHERE refresh_token = %s AND customer_id IS NOT NULL",
            (refresh_token,)
        )
        token_record = cursor.fetchone()

        if not token_record or token_record["revoked"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid refresh token."}, status=401)

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.execute("DELETE FROM refresh_tokens WHERE refresh_token = %s", (refresh_token,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Expired refresh token."}, status=401)

        # Fetch customer email
        cursor.execute("SELECT email FROM customers WHERE customer_id = %s", (token_record["customer_id"],))
        customer = cursor.fetchone()

        cursor.close()
        conn.close()

        if not customer:
            return jsonify({"status": False, "message": "Customer associated with token not found."}, status=401)

        access_token = generate_access_token(token_record["customer_id"], customer["email"], "customer")

        return jsonify({
            "status": True,
            "message": "Access token refreshed successfully.",
            "access_token": access_token,
            "token": access_token
        }, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_logout(request):
    try:
        data = get_json_data(request)
        refresh_token = data.get("refresh_token")
        if refresh_token:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM refresh_tokens WHERE refresh_token = %s", (refresh_token,))
            conn.commit()
            cursor.close()
            conn.close()

        return jsonify({"status": True, "message": "Logged out successfully."}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# CUSTOMER PROFILE
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def get_customer_profile(request):
    try:
        user_payload = get_current_user(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT customer_id, full_name, email, phone, gender, date_of_birth, profile_image, address, city, state, pincode, status, email_verified, created_at FROM customers WHERE customer_id = %s",
            (user_payload["user_id"],)
        )
        customer = cursor.fetchone()
        cursor.close()
        conn.close()

        if not customer:
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        if customer.get("created_at"):
            customer["created_at"] = customer["created_at"].isoformat()
        if customer.get("date_of_birth"):
            customer["date_of_birth"] = customer["date_of_birth"].isoformat()

        return jsonify({
            "status": True,
            "message": "Profile fetched successfully.",
            "user": customer
        }, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
def update_customer_profile(request):
    try:
        user_payload = get_current_user(request)
        data = get_json_data(request)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Get existing details
        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (user_payload["user_id"],))
        customer = cursor.fetchone()

        if not customer:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        full_name = data.get("full_name", customer["full_name"])
        phone = data.get("phone", customer["phone"])
        gender = data.get("gender", customer["gender"])
        date_of_birth = data.get("date_of_birth", customer["date_of_birth"])
        profile_image = data.get("profile_image", customer["profile_image"])
        address = data.get("address", customer["address"])
        city = data.get("city", customer["city"])
        state = data.get("state", customer["state"])
        pincode = data.get("pincode", customer["pincode"])

        query = """
        UPDATE customers
        SET full_name = %s, phone = %s, gender = %s, date_of_birth = %s, profile_image = %s, address = %s, city = %s, state = %s, pincode = %s
        WHERE customer_id = %s
        """
        cursor.execute(query, (full_name, phone, gender, date_of_birth, profile_image, address, city, state, pincode, user_payload["user_id"]))
        conn.commit()

        # Fetch updated customer
        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (user_payload["user_id"],))
        updated_customer = cursor.fetchone()

        cursor.close()
        conn.close()

        if updated_customer.get("created_at"):
            updated_customer["created_at"] = updated_customer["created_at"].isoformat()
        if updated_customer.get("date_of_birth") and hasattr(updated_customer["date_of_birth"], 'isoformat'):
            updated_customer["date_of_birth"] = updated_customer["date_of_birth"].isoformat()

        return jsonify({
            "status": True,
            "message": "Profile updated successfully.",
            "user": updated_customer
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# CATEGORIES & SERVICES (PUBLIC)
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def list_categories(request):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categories WHERE status='Active'")
        categories = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "categories": categories}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_services(request):
    try:
        category_id = request.GET.get("category_id")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        if category_id:
            cursor.execute("SELECT * FROM services WHERE category_id = %s AND status='Active'", (category_id,))
        else:
            cursor.execute("SELECT * FROM services WHERE status='Active'")
        
        services = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "services": services}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# BOOKINGS
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def create_booking(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Only customers can create bookings."}, status=403)

        data = get_json_data(request)
        provider_id = data.get("provider_id")
        service_id = data.get("service_id")
        booking_date = data.get("booking_date")
        booking_time = data.get("booking_time")
        service_address = data.get("service_address")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")
        problem_description = data.get("problem_description")

        if not provider_id or not service_id or not booking_date or not booking_time or not service_address:
            return jsonify({"status": False, "message": "Missing required booking details."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Retrieve estimated price from provider_services or services
        cursor.execute(
            "SELECT service_charge FROM provider_services WHERE provider_id = %s AND service_id = %s AND is_available = 1 LIMIT 1",
            (provider_id, service_id)
        )
        ps = cursor.fetchone()
        if ps:
            price = ps["service_charge"]
        else:
            cursor.execute("SELECT estimated_price FROM services WHERE service_id = %s LIMIT 1", (service_id,))
            s = cursor.fetchone()
            if not s:
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": "Service not found."}, status=404)
            price = s["estimated_price"]

        # Generate unique booking number
        bk_num = f"BK-{datetime.datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

        # Generate a secure single-use completion token for email buttons
        completion_token = secrets.token_urlsafe(32)

        query = """
        INSERT INTO bookings
        (booking_number, customer_id, provider_id, service_id, booking_date, booking_time, service_address, city, state, pincode, problem_description, estimated_price, booking_status, payment_status, completion_token)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', 'Pending', %s)
        """
        cursor.execute(query, (bk_num, user_payload["user_id"], provider_id, service_id, booking_date, booking_time, service_address, city, state, pincode, problem_description, price, completion_token))
        booking_id = cursor.lastrowid
        conn.commit()

        # Insert Booking History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, NULL, 'Pending', 'Booking created by customer', 'Customer')",
            (booking_id,)
        )
        conn.commit()

        # Create Notifications
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Booking Created', %s, 0)",
            (user_payload["user_id"], f"Your booking request {bk_num} has been created successfully.")
        )
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Booking', 'New Booking Request', %s, 0)",
            (provider_id, f"You have a new booking request {bk_num} from customer.")
        )
        conn.commit()

        # Fetch booking details for response
        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        booking_record = cursor.fetchone()

        # ── Send HTML Booking Confirmation Email ──────────────────────────────
        try:
            # Use form-supplied values (what the customer typed in the booking form)
            form_customer_name   = data.get("customer_name", "").strip()
            form_customer_email  = data.get("customer_email", "").strip()
            form_customer_mobile = data.get("customer_mobile", "").strip()
            form_category        = data.get("category", "").strip()

            # Fetch customer details from DB as fallback
            cursor.execute(
                "SELECT full_name, email, phone FROM customers WHERE customer_id = %s",
                (user_payload["user_id"],)
            )
            cust_row = cursor.fetchone()

            # Resolve recipient — form email takes priority; fall back to registered email
            customer_name   = form_customer_name  or (cust_row["full_name"] if cust_row else "Valued Customer")
            customer_email  = form_customer_email or (cust_row["email"]     if cust_row else "")
            customer_mobile = form_customer_mobile or (cust_row["phone"]    if cust_row else "N/A")

            if not customer_email:
                raise ValueError("No customer email available to send confirmation.")

            # Fetch service, provider & category details
            cursor.execute(
                "SELECT s.service_name, s.category_id, "
                "       c.category_name, "
                "       p.business_name, p.owner_name, p.phone as provider_phone "
                "FROM services s "
                "LEFT JOIN categories c ON c.category_id = s.category_id "
                "JOIN providers p ON p.provider_id = %s "
                "WHERE s.service_id = %s LIMIT 1",
                (provider_id, service_id)
            )
            sp_row = cursor.fetchone()

            if sp_row:
                service_name_txt  = sp_row["service_name"]
                category_txt      = form_category or sp_row.get("category_name") or "General"
                provider_name_txt = sp_row.get("business_name") or sp_row.get("owner_name") or "Your Provider"
            else:
                service_name_txt  = "Booked Service"
                category_txt      = form_category or "General"
                provider_name_txt = "Your Provider"

            # Format values
            try:
                price_txt = f"\u20b9{float(price):,.2f}" if price else "As per visit"
            except Exception:
                price_txt = f"\u20b9{price}" if price else "As per visit"

            date_txt = str(booking_date)
            backend_url = os.environ.get("BACKEND_URL", "https://local-service-booking-system.onrender.com")

            # Build secure action button URLs
            completion_url = f"{backend_url}/api/customer/service-completed/{booking_id}?token={completion_token}"
            review_url     = f"{backend_url}/api/customer/review/{booking_id}?token={completion_token}"

            html_body = get_booking_confirmation_template(
                booking_number=bk_num,
                customer_name=customer_name,
                provider_name=provider_name_txt,
                service_name=service_name_txt,
                booking_date=date_txt,
                price=price,
                status="Pending Confirmation",
                completion_url=completion_url,
                review_url=review_url
            )
            send_email_async(customer_email, f"Booking Confirmation – {bk_num} | Fixora", html_body)
        except Exception as email_err:
            # Email failure must NEVER roll back or cancel the booking
            import logging
            logging.getLogger(__name__).error(f"Booking email error for {bk_num}: {email_err}")
        # ── End Email ──────────────────────────────────────────────────────────

        cursor.close()
        conn.close()

        if booking_record.get("booking_date"):
            booking_record["booking_date"] = booking_record["booking_date"].isoformat()
        if booking_record.get("booking_time"):
            booking_record["booking_time"] = str(booking_record["booking_time"])
        if booking_record.get("estimated_price"):
            booking_record["estimated_price"] = float(booking_record["estimated_price"])

        return jsonify({
            "status": True,
            "message": "Booking created successfully.",
            "booking": booking_record
        }, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ── Service Completed (called from email button – no auth needed) ─────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def mark_service_completed(request, booking_id):
    """
    Hit when customer clicks "SERVICE COMPLETED" in the email.
    Verifies token, marks booking_status = 'Completed', customer_confirmed = 1, completed_at = NOW(),
    and redirects to Django success page (/completed).
    """
    token = request.GET.get("token", "").strip()

    if not token:
        return redirect(f"/completed?booking_id={booking_id}&status=missing_token")

    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT booking_id, customer_id, completion_token, customer_confirmed, booking_status FROM bookings WHERE booking_id = %s",
            (booking_id,)
        )
        row = cursor.fetchone()

        if not row:
            cursor.close(); conn.close()
            return redirect(f"/completed?booking_id={booking_id}&status=not_found")

        if row["completion_token"] != token:
            cursor.close(); conn.close()
            return redirect(f"/completed?booking_id={booking_id}&status=invalid_token")

        # Update bookings table: status = 'Completed', customer_confirmed = 1, completed_at = NOW()
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Completed', customer_confirmed = 1, completed_at = NOW() WHERE booking_id = %s",
            (booking_id,)
        )
        conn.commit()
        cursor.close(); conn.close()
        return redirect(f"/completed?booking_id={booking_id}&token={token}")

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"service-completed error: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return redirect(f"/completed?booking_id={booking_id}&token={token}&status=error")


@api_view(["GET"])
@permission_classes([AllowAny])
def service_completed_success_page(request):
    """
    Django view rendering the responsive Fixora Black + Gold completion success page directly.
    """
    booking_id = request.GET.get("booking_id", "").strip()
    token = request.GET.get("token", "").strip()
    backend_url = os.environ.get("BACKEND_URL", "https://local-service-booking-system.onrender.com")

    if booking_id and token:
        review_url = f"{backend_url}/api/customer/review/{booking_id}?token={token}"
    elif booking_id:
        review_url = f"{backend_url}/api/customer/review/{booking_id}"
    else:
        review_url = f"{backend_url}/api/customer/review/1"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Successfully Completed | Fixora</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: 'Outfit', sans-serif;
      background: #0A0A0A;
      color: #E0E0E0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}
    .card {{
      background: #121212;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.15);
    }}
    .logo {{
      color: #D4AF37;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 28px;
      text-transform: uppercase;
    }}
    .icon-badge {{
      width: 84px;
      height: 84px;
      background: rgba(34, 197, 94, 0.12);
      border: 2px solid #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      margin: 0 auto 24px auto;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.25);
    }}
    h1 {{
      font-size: 25px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 16px;
      line-height: 1.3;
    }}
    p.text-main {{
      font-size: 16px;
      color: #CCCCCC;
      line-height: 1.6;
      margin-bottom: 6px;
    }}
    p.text-sub {{
      font-size: 15px;
      color: #D4AF37;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 32px;
    }}
    .btn-review {{
      display: inline-block;
      width: 100%;
      padding: 16px 28px;
      background: linear-gradient(135deg, #F4C542 0%, #D4AF37 100%);
      color: #0D0D0D !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      border-radius: 30px;
      letter-spacing: 1px;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
      transition: all 0.3s ease;
    }}
    .btn-review:hover {{
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(212, 175, 55, 0.5);
    }}
    .footer-copy {{
      margin-top: 32px;
      font-size: 12px;
      color: #555555;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <div class="icon-badge">✅</div>
    <h1>Service Successfully Completed</h1>
    <p class="text-main">Thank you for confirming.</p>
    <p class="text-main">Your booking has been marked as completed.</p>
    <p class="text-sub">You may now leave a review.</p>
    <a href="{review_url}" class="btn-review">⭐ Leave Review</a>
    <div class="footer-copy">&copy; Fixora. All rights reserved.</div>
  </div>
</body>
</html>"""
    return HttpResponse(html)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def get_customer_booking_history(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT b.*, s.service_name, p.business_name as provider_name
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN providers p ON b.provider_id = p.provider_id
        WHERE b.customer_id = %s
        ORDER BY b.created_at DESC
        """
        cursor.execute(query, (user_payload["user_id"],))
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()

        for b in bookings:
            if b.get("booking_date"):
                b["booking_date"] = b["booking_date"].isoformat()
            if b.get("booking_time"):
                b["booking_time"] = str(b["booking_time"])
            if b.get("estimated_price"):
                b["estimated_price"] = float(b["estimated_price"])
            if b.get("final_price"):
                b["final_price"] = float(b["final_price"])
            if b.get("accepted_at"):
                b["accepted_at"] = b["accepted_at"].isoformat()
            if b.get("started_at"):
                b["started_at"] = b["started_at"].isoformat()
            if b.get("completed_at"):
                b["completed_at"] = b["completed_at"].isoformat()
            if b.get("cancelled_at"):
                b["cancelled_at"] = b["cancelled_at"].isoformat()
            if b.get("created_at"):
                b["created_at"] = b["created_at"].isoformat()
            if b.get("updated_at"):
                b["updated_at"] = b["updated_at"].isoformat()

        return jsonify({"status": True, "bookings": bookings}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def cancel_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        reason = data.get("reason", "Cancelled by customer")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] in ['Completed', 'Cancelled', 'Rejected']:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking cannot be cancelled in its current state."}, status=400)

        old_status = booking["booking_status"]

        # Update Booking Status
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Cancelled', cancellation_reason = %s, cancelled_by = 'Customer', cancelled_at = NOW() WHERE booking_id = %s",
            (reason, booking_id)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, %s, 'Cancelled', %s, 'Customer')",
            (booking_id, old_status, reason)
        )

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Booking', 'Booking Cancelled', %s, 0)",
            (booking["provider_id"], f"Booking request {booking['booking_number']} has been cancelled by customer.")
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"status": True, "message": "Booking cancelled successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def customer_complete_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] == 'Completed':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking is already completed."}, status=400)

        # Update Booking Status
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Completed', completed_by = 'customer', completed_at = NOW() WHERE booking_id = %s",
            (booking_id,)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, %s, 'Completed', 'Job marked completed by customer', 'Customer')",
            (booking_id, booking["booking_status"])
        )
        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Booking', 'Booking Completed', %s, 0)",
            (booking["provider_id"], f"Booking request {booking['booking_number']} has been completed by the customer.")
        )
        conn.commit()

        # Fetch details for email
        cursor.execute("SELECT full_name, email FROM customers WHERE customer_id = %s", (booking["customer_id"],))
        customer = cursor.fetchone()
        cursor.execute("SELECT business_name, owner_name FROM providers WHERE provider_id = %s", (booking["provider_id"],))
        provider = cursor.fetchone()
        cursor.execute("SELECT service_name FROM services WHERE service_id = %s", (booking["service_id"],))
        service = cursor.fetchone()

        customer_name = customer["full_name"] if customer else "Customer"
        customer_email = customer["email"] if customer else ""
        provider_name = (provider["business_name"] or provider["owner_name"]) if provider else "Provider"
        service_name = service["service_name"] if service else "Service"
        final_price = float(booking["final_price"]) if booking["final_price"] else (float(booking["estimated_price"]) if booking["estimated_price"] else 0.0)

        # Send Booking Completed Email
        try:
            completed_email_body = get_booking_completed_template(
                booking_number=booking["booking_number"] or f"#{booking['booking_id']}",
                customer_name=customer_name,
                provider_name=provider_name,
                service_name=service_name,
                booking_date=str(booking["booking_date"]),
                price=final_price,
                status="Completed"
            )
            send_email_async(customer_email, "Your Booking has been Completed ✅", completed_email_body)
        except Exception as email_err:
            import logging
            logging.getLogger(__name__).error(f"Booking completed email error: {email_err}")

        # Send Review Request Email
        try:
            backend_url = os.environ.get("BACKEND_URL", "https://local-service-booking-system.onrender.com")
            review_link = f"{backend_url}/api/customer/review/{booking['booking_id']}?token={booking['completion_token']}"
            review_email_body = get_review_request_template(
                booking_number=booking["booking_number"] or f"#{booking['booking_id']}",
                customer_name=customer_name,
                provider_name=provider_name,
                service_name=service_name,
                review_link=review_link
            )
            send_email_async(customer_email, "How was your experience?", review_email_body)
        except Exception as email_err:
            import logging
            logging.getLogger(__name__).error(f"Review request email error: {email_err}")

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking marked as completed successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# REVIEWS
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def create_review(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        booking_id = data.get("booking_id")
        rating = data.get("rating")
        review_text = data.get("review_text")
        review_title = data.get("review_title")

        if not booking_id or not rating:
            return jsonify({"status": False, "message": "Booking ID and Rating are required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check booking
        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] != 'Completed':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Reviews can only be written for completed bookings."}, status=400)

        # Check existing review
        cursor.execute("SELECT review_id FROM reviews WHERE booking_id = %s", (booking_id,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Review already exists for this booking."}, status=400)

        # Insert Review
        cursor.execute(
            "INSERT INTO reviews (booking_id, customer_id, provider_id, rating, review_text, review_title) VALUES (%s, %s, %s, %s, %s, %s)",
            (booking_id, user_payload["user_id"], booking["provider_id"], rating, review_text, review_title)
        )
        # Mark review_given on the booking
        cursor.execute("UPDATE bookings SET review_given = 1 WHERE booking_id = %s", (booking_id,))
        conn.commit()

        # Recalculate Rating
        cursor.execute("SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE provider_id = %s", (booking["provider_id"],))
        stats = cursor.fetchone()
        avg_rating = round(float(stats["avg_r"]), 1) if stats["avg_r"] else 0.0
        total_rev = stats["cnt"] or 0

        cursor.execute(
            "UPDATE providers SET average_rating = %s, total_reviews = %s WHERE provider_id = %s",
            (avg_rating, total_rev, booking["provider_id"])
        )
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Review', 'New Review Left', %s, 0)",
            (booking["provider_id"], f"A customer left a review with rating {rating} for booking {booking['booking_number']}.")
        )
        conn.commit()

        # Get updated provider details to return
        cursor.execute("SELECT provider_id, business_name, owner_name, email, phone, average_rating, total_reviews, status FROM providers WHERE provider_id = %s", (booking["provider_id"],))
        updated_provider = cursor.fetchone()
        if updated_provider and updated_provider.get("average_rating") is not None:
            updated_provider["average_rating"] = float(updated_provider["average_rating"])

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Review submitted successfully.",
            "data": {
                "provider": updated_provider
            }
        }, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ── Public Review via Email Link (no auth, uses completion_token) ─────────────
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def public_review(request, booking_id):
    """
    GET  – Verify that a token is valid and return booking + provider name for the review form.
    POST – Submit a review; validated by the completion_token (no login required).
    """
    token = request.GET.get("token", "").strip() or (get_json_data(request)).get("token", "").strip()

    if not token:
        return jsonify({"status": False, "message": "Missing token."}, status=400)

    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """SELECT b.*, p.business_name, p.owner_name, s.service_name, c.full_name as customer_name
               FROM bookings b
               JOIN providers p ON p.provider_id = b.provider_id
               JOIN services  s ON s.service_id  = b.service_id
               JOIN customers c ON c.customer_id  = b.customer_id
               WHERE b.booking_id = %s""",
            (booking_id,)
        )
        booking = cursor.fetchone()

        if not booking:
            cursor.close(); conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["completion_token"] != token:
            cursor.close(); conn.close()
            return jsonify({"status": False, "message": "Invalid or expired link."}, status=403)

        if request.method == "GET":
            cursor.close(); conn.close()
            return jsonify({
                "status": True,
                "booking_id":    booking["booking_id"],
                "booking_number": booking["booking_number"],
                "customer_name": booking["customer_name"],
                "provider_name": booking.get("business_name") or booking.get("owner_name") or "Provider",
                "service_name":  booking["service_name"],
                "review_given":  bool(booking.get("review_given")),
            }, status=200)

        # POST — submit the review
        data = get_json_data(request)
        rating       = data.get("rating")
        review_text  = data.get("review_text", "")
        review_title = data.get("review_title", "")

        if not rating:
            cursor.close(); conn.close()
            return jsonify({"status": False, "message": "Rating is required."}, status=400)

        if booking.get("review_given"):
            cursor.close(); conn.close()
            return jsonify({"status": False, "message": "Review already submitted."}, status=400)

        cursor.execute(
            "SELECT review_id FROM reviews WHERE booking_id = %s",
            (booking_id,)
        )
        if cursor.fetchone():
            cursor.close(); conn.close()
            return jsonify({"status": False, "message": "Review already submitted."}, status=400)

        cursor.execute(
            "INSERT INTO reviews (booking_id, customer_id, provider_id, rating, review_text, review_title) VALUES (%s, %s, %s, %s, %s, %s)",
            (booking_id, booking["customer_id"], booking["provider_id"], rating, review_text, review_title)
        )
        cursor.execute("UPDATE bookings SET review_given = 1 WHERE booking_id = %s", (booking_id,))
        conn.commit()

        # Recalculate provider rating
        cursor.execute("SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE provider_id = %s", (booking["provider_id"],))
        stats = cursor.fetchone()
        avg_r = round(float(stats["avg_r"]), 1) if stats["avg_r"] else 0.0
        cursor.execute(
            "UPDATE providers SET average_rating = %s, total_reviews = %s WHERE provider_id = %s",
            (avg_r, stats["cnt"], booking["provider_id"])
        )
        conn.commit()
        cursor.close(); conn.close()

        return jsonify({"status": True, "message": "Review submitted successfully. Thank you!"}, status=201)

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"public_review error: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close(); conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ── HTML Review Page (GET) & Submit Review (POST) directly from Django ────────
@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def customer_review_page(request, booking_id):
    """
    GET  - Returns a professional HTML Review Page (Fixora Black + Gold) directly from Django.
    POST - Processes review submission, updates reviews & bookings tables, and shows confirmation.
    """
    token = request.GET.get("token", "").strip() or (request.POST.get("token", "").strip() if request.POST else "")
    backend_url = os.environ.get("BACKEND_URL", "https://local-service-booking-system.onrender.com")

    if not token:
        return HttpResponse("""<!DOCTYPE html>
<html>
<head><title>Invalid Request | Fixora</title>
<style>
body { font-family: sans-serif; background: #0A0A0A; color: #FFF; text-align: center; padding: 50px; }
.card { background: #121212; border: 1px solid rgba(212, 175, 55, 0.3); padding: 40px; border-radius: 20px; max-width: 450px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
.logo { color: #D4AF37; font-size: 24px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <h2 style="color: #ef4444;">Invalid Review Link</h2>
    <p style="color: #aaa; margin-top: 10px;">Security token is missing.</p>
  </div>
</body>
</html>"""), 400

    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """SELECT b.booking_id, b.booking_number, b.completion_token, b.review_given, b.customer_id, b.provider_id,
                      s.service_name, c.full_name as customer_name,
                      COALESCE(p.business_name, p.owner_name) as provider_name
               FROM bookings b
               JOIN services s ON s.service_id = b.service_id
               JOIN customers c ON c.customer_id = b.customer_id
               JOIN providers p ON p.provider_id = b.provider_id
               WHERE b.booking_id = %s""",
            (booking_id,)
        )
        booking = cursor.fetchone()

        if not booking:
            cursor.close(); conn.close()
            return HttpResponse("""<!DOCTYPE html>
<html>
<head><title>Booking Not Found | Fixora</title>
<style>
body { font-family: sans-serif; background: #0A0A0A; color: #FFF; text-align: center; padding: 50px; }
.card { background: #121212; border: 1px solid rgba(212, 175, 55, 0.3); padding: 40px; border-radius: 20px; max-width: 450px; margin: 0 auto; }
.logo { color: #D4AF37; font-size: 24px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <h2 style="color: #ef4444;">Booking Not Found</h2>
    <p style="color: #aaa; margin-top: 10px;">The specified booking record could not be found.</p>
  </div>
</body>
</html>"""), 404

        if booking["completion_token"] != token:
            cursor.close(); conn.close()
            return HttpResponse("""<!DOCTYPE html>
<html>
<head><title>Invalid Link | Fixora</title>
<style>
body { font-family: sans-serif; background: #0A0A0A; color: #FFF; text-align: center; padding: 50px; }
.card { background: #121212; border: 1px solid rgba(212, 175, 55, 0.3); padding: 40px; border-radius: 20px; max-width: 450px; margin: 0 auto; }
.logo { color: #D4AF37; font-size: 24px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <h2 style="color: #ef4444;">Invalid or Expired Link</h2>
    <p style="color: #aaa; margin-top: 10px;">This review link is not valid for this booking.</p>
  </div>
</body>
</html>"""), 403

        # Check existing review in reviews table
        cursor.execute("SELECT review_id FROM reviews WHERE booking_id = %s", (booking_id,))
        existing_review = cursor.fetchone()

        # Handle POST - Submit Review
        if request.method == "POST":
            if booking.get("review_given") or existing_review:
                cursor.close(); conn.close()
                return HttpResponse("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Already Submitted | Fixora</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background: #0A0A0A; color: #E0E0E0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #121212; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; padding: 40px 30px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
    .logo { color: #D4AF37; font-size: 24px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
    .stars { color: #D4AF37; font-size: 36px; margin-bottom: 16px; letter-spacing: 6px; }
    h1 { font-size: 24px; color: #FFF; margin-bottom: 12px; }
    p { color: #AAA; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <div class="stars">★★★★★</div>
    <h1>Thank you!</h1>
    <p>Your review has already been submitted for this booking.</p>
  </div>
</body>
</html>""")

            rating_raw = request.POST.get("rating") if request.POST else (get_json_data(request)).get("rating")
            review_text = (request.POST.get("review_text", "").strip() if request.POST else (get_json_data(request)).get("review_text", "").strip())
            review_title = (request.POST.get("review_title", "").strip() if request.POST else (get_json_data(request)).get("review_title", "").strip())

            try:
                rating = int(rating_raw)
            except Exception:
                rating = 5

            # Insert into reviews table
            cursor.execute(
                "INSERT INTO reviews (booking_id, customer_id, provider_id, rating, review_text, review_title) VALUES (%s, %s, %s, %s, %s, %s)",
                (booking_id, booking["customer_id"], booking["provider_id"], rating, review_text, review_title)
            )

            # Update bookings table: review_given = 1
            cursor.execute("UPDATE bookings SET review_given = 1 WHERE booking_id = %s", (booking_id,))

            # Recalculate provider stats
            cursor.execute("SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE provider_id = %s", (booking["provider_id"],))
            stats = cursor.fetchone()
            avg_r = round(float(stats["avg_r"]), 1) if stats and stats.get("avg_r") else 0.0
            cnt = stats["cnt"] if stats and stats.get("cnt") else 0
            cursor.execute(
                "UPDATE providers SET average_rating = %s, total_reviews = %s WHERE provider_id = %s",
                (avg_r, cnt, booking["provider_id"])
            )
            conn.commit()
            cursor.close(); conn.close()

            return HttpResponse("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Submitted | Fixora</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: #0A0A0A;
      color: #E0E0E0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #121212;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.15);
    }
    .logo {
      color: #D4AF37;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .stars {
      color: #D4AF37;
      font-size: 38px;
      margin-bottom: 18px;
      letter-spacing: 6px;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 14px;
    }
    p {
      font-size: 16px;
      color: #CCCCCC;
      line-height: 1.6;
    }
    .footer-copy {
      margin-top: 32px;
      font-size: 12px;
      color: #555555;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <div class="stars">★★★★★</div>
    <h1>Thank you!</h1>
    <p>Your review has been submitted successfully.</p>
    <div class="footer-copy">&copy; Fixora. All rights reserved.</div>
  </div>
</body>
</html>""")

        # GET - Show Review Form or Already Submitted Page
        if booking.get("review_given") or existing_review:
            cursor.close(); conn.close()
            return HttpResponse("""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Review Already Submitted | Fixora</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background: #0A0A0A; color: #E0E0E0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #121212; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; padding: 40px 30px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
    .logo { color: #D4AF37; font-size: 24px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px; text-transform: uppercase; }
    .stars { color: #D4AF37; font-size: 36px; margin-bottom: 16px; letter-spacing: 6px; }
    h1 { font-size: 24px; color: #FFF; margin-bottom: 12px; }
    p { color: #AAA; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <div class="stars">★★★★★</div>
    <h1>Thank you!</h1>
    <p>Your review has already been submitted for this booking.</p>
  </div>
</body>
</html>""")

        cursor.close(); conn.close()

        # Render HTML Review Page
        bk_num = booking.get("booking_number") or f"#{booking['booking_id']}"
        provider_name = booking.get("provider_name") or "Service Provider"
        service_name = booking.get("service_name") or "Local Service"

        html_review_form = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave a Review | Fixora</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Outfit', sans-serif;
      background: #0A0A0A;
      color: #E0E0E0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}
    .card {{
      background: #121212;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.12);
    }}
    .logo {{
      color: #D4AF37;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 4px;
      text-align: center;
      margin-bottom: 24px;
      text-transform: uppercase;
    }}
    .info-box {{
      background: #1A1A1A;
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }}
    .info-row {{
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px solid #262626;
    }}
    .info-row:last-child {{ border-bottom: none; }}
    .info-label {{ color: #888; font-weight: 500; }}
    .info-val {{ color: #FFF; font-weight: 600; text-align: right; }}
    
    h2 {{
      font-size: 20px;
      color: #FFF;
      text-align: center;
      margin-bottom: 16px;
    }}
    
    /* Star Rating */
    .star-rating {{
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 24px;
      direction: row;
    }}
    .star {{
      font-size: 36px;
      color: #333333;
      cursor: pointer;
      transition: color 0.2s ease, transform 0.2s ease;
      user-select: none;
    }}
    .star.active, .star:hover, .star.hovered {{
      color: #D4AF37;
      transform: scale(1.15);
    }}

    .form-group {{
      margin-bottom: 20px;
    }}
    label {{
      display: block;
      font-size: 13px;
      color: #AAA;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    textarea {{
      width: 100%;
      background: #1A1A1A;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 12px;
      padding: 14px;
      color: #FFF;
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      resize: vertical;
      outline: none;
      transition: border 0.3s ease;
    }}
    textarea:focus {{
      border-color: #D4AF37;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }}
    .btn {{
      display: block;
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #F4C542 0%, #D4AF37 100%);
      color: #0D0D0D;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 15px;
      border-radius: 30px;
      border: none;
      cursor: pointer;
      letter-spacing: 1px;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
      transition: all 0.3s ease;
      text-transform: uppercase;
    }}
    .btn:hover {{
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(212, 175, 55, 0.5);
    }}
    .footer-copy {{
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #555555;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FIXORA</div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Booking ID</span>
        <span class="info-val">{bk_num}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Service</span>
        <span class="info-val">{service_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Provider</span>
        <span class="info-val">{provider_name}</span>
      </div>
    </div>

    <h2>Rate Your Experience</h2>

    <form method="POST" action="{backend_url}/api/customer/review/{booking_id}">
      <input type="hidden" name="token" value="{token}">
      <input type="hidden" name="rating" id="ratingInput" value="5">

      <div class="star-rating" id="starRating">
        <span class="star active" data-val="1">★</span>
        <span class="star active" data-val="2">★</span>
        <span class="star active" data-val="3">★</span>
        <span class="star active" data-val="4">★</span>
        <span class="star active" data-val="5">★</span>
      </div>

      <div class="form-group">
        <label for="reviewText">Your Review</label>
        <textarea id="reviewText" name="review_text" rows="4" placeholder="Share details about your experience with {provider_name}..." required></textarea>
      </div>

      <button type="submit" class="btn">Submit Review</button>
    </form>

    <div class="footer-copy">&copy; Fixora. All rights reserved.</div>
  </div>

  <script>
    const stars = document.querySelectorAll('#starRating .star');
    const ratingInput = document.getElementById('ratingInput');

    stars.forEach((star) => {{
      star.addEventListener('click', () => {{
        const val = parseInt(star.getAttribute('data-val'));
        ratingInput.value = val;
        updateStars(val);
      }});

      star.addEventListener('mouseover', () => {{
        const val = parseInt(star.getAttribute('data-val'));
        highlightStars(val);
      }});

      star.addEventListener('mouseleave', () => {{
        const currentVal = parseInt(ratingInput.value);
        updateStars(currentVal);
      }});
    }});

    function updateStars(val) {{
      stars.forEach(s => {{
        const v = parseInt(s.getAttribute('data-val'));
        if (v <= val) {{
          s.classList.add('active');
          s.classList.remove('hovered');
        }} else {{
          s.classList.remove('active');
          s.classList.remove('hovered');
        }}
      }});
    }}

    function highlightStars(val) {{
      stars.forEach(s => {{
        const v = parseInt(s.getAttribute('data-val'));
        if (v <= val) {{
          s.classList.add('active');
        }} else {{
          s.classList.remove('active');
        }}
      }});
    }}
  </script>
</body>
</html>"""
        return HttpResponse(html_review_form)

    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"customer_review_page error: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close(); conn.close()
        return HttpResponse(f"<h2>Server Error: {str(e)}</h2>", status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_provider_reviews(request, provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT r.*, c.full_name as customer_name
        FROM reviews r
        JOIN customers c ON r.customer_id = c.customer_id
        WHERE r.provider_id = %s
        ORDER BY r.created_at DESC
        """
        cursor.execute(query, (provider_id,))
        reviews = cursor.fetchall()
        cursor.close()
        conn.close()

        for r in reviews:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
            if r.get("updated_at"):
                r["updated_at"] = r["updated_at"].isoformat()
            if r.get("reply_date"):
                r["reply_date"] = r["reply_date"].isoformat()

        return jsonify({"status": True, "reviews": reviews}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# PAYMENTS
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def create_payment(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        booking_id = data.get("booking_id")

        if not booking_id:
            return jsonify({"status": False, "message": "Booking ID is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        # Update Payment Status to 'Paid'
        cursor.execute(
            "UPDATE bookings SET payment_status = 'Paid' WHERE booking_id = %s",
            (booking_id,)
        )
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Payment', 'Payment Received', %s, 0)",
            (booking["provider_id"], f"Payment of booking {booking['booking_number']} has been completed.")
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"status": True, "message": "Payment successful."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_payment_status(request, booking_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT booking_id, payment_status, estimated_price, final_price FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()
        cursor.close()
        conn.close()

        if not booking:
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking.get("estimated_price"):
            booking["estimated_price"] = float(booking["estimated_price"])
        if booking.get("final_price"):
            booking["final_price"] = float(booking["final_price"])

        return jsonify({"status": True, "payment": booking}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def get_payment_history(request):
    try:
        user_payload = get_current_user(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        if user_payload["role"] == "customer":
            query = """
            SELECT booking_id, booking_number, estimated_price, final_price, payment_status, booking_status, created_at
            FROM bookings
            WHERE customer_id = %s AND payment_status != 'Pending'
            ORDER BY created_at DESC
            """
            cursor.execute(query, (user_payload["user_id"],))
        elif user_payload["role"] == "provider":
            query = """
            SELECT booking_id, booking_number, estimated_price, final_price, payment_status, booking_status, created_at
            FROM bookings
            WHERE provider_id = %s AND payment_status != 'Pending'
            ORDER BY created_at DESC
            """
            cursor.execute(query, (user_payload["user_id"],))
        else:
            # Admin can view all
            query = """
            SELECT booking_id, booking_number, estimated_price, final_price, payment_status, booking_status, created_at
            FROM bookings
            WHERE payment_status != 'Pending'
            ORDER BY created_at DESC
            """
            cursor.execute(query)

        payments = cursor.fetchall()
        cursor.close()
        conn.close()

        for p in payments:
            if p.get("created_at"):
                p["created_at"] = p["created_at"].isoformat()
            if p.get("estimated_price"):
                p["estimated_price"] = float(p["estimated_price"])
            if p.get("final_price"):
                p["final_price"] = float(p["final_price"])

        return jsonify({"status": True, "payments": payments}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# NOTIFICATIONS
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def list_notifications(request):
    try:
        user_payload = get_current_user(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Normalize role name
        role = user_payload["role"].lower()
        if "admin" in role:
            user_type = 'Admin'
        elif "provider" in role:
            user_type = 'Provider'
        else:
            user_type = 'Customer'

        cursor.execute(
            "SELECT * FROM notifications WHERE user_id = %s AND user_type = %s ORDER BY created_at DESC",
            (user_payload["user_id"], user_type)
        )
        notifications = cursor.fetchall()
        cursor.close()
        conn.close()

        for n in notifications:
            if n.get("created_at"):
                n["created_at"] = n["created_at"].isoformat()

        return jsonify({"status": True, "notifications": notifications}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
def mark_notification_read(request, notification_id):
    try:
        user_payload = get_current_user(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Normalize role name
        role = user_payload["role"].lower()
        if "admin" in role:
            user_type = 'Admin'
        elif "provider" in role:
            user_type = 'Provider'
        else:
            user_type = 'Customer'

        # Check notification
        cursor.execute("SELECT * FROM notifications WHERE notification_id = %s AND user_id = %s AND user_type = %s", (notification_id, user_payload["user_id"], user_type))
        notification = cursor.fetchone()

        if not notification:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Notification not found."}, status=404)

        cursor.execute("UPDATE notifications SET is_read = 1 WHERE notification_id = %s", (notification_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Notification marked as read."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# CUSTOMER PROVIDER LIST & DETAILS (DIRECTORY)
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def customer_list_providers(request):
    try:
        category_id = request.GET.get("category_id")
        city = request.GET.get("city")
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT provider_id, business_name, owner_name, email, phone, category_id, 
               profile_image, address, city, state, pincode, experience_years, 
               description, average_rating, total_reviews, status 
        FROM providers 
        WHERE status = 'Approved' AND email_verified = 1
        """
        params = []
        if category_id:
            query += " AND category_id = %s"
            params.append(category_id)
        if city:
            query += " AND city = %s"
            params.append(city)
            
        cursor.execute(query, tuple(params))
        providers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        for p in providers:
            if p.get("average_rating"):
                p["average_rating"] = float(p["average_rating"])
                
        return jsonify({"status": True, "providers": providers}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def customer_get_provider_details(request, provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT provider_id, business_name, owner_name, email, phone, category_id, 
                   profile_image, address, city, state, pincode, experience_years, 
                   description, average_rating, total_reviews, status 
            FROM providers 
            WHERE provider_id = %s
            """,
            (provider_id,)
        )
        provider = cursor.fetchone()
        
        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)
            
        # Get linked services
        cursor.execute(
            """
            SELECT ps.provider_service_id, ps.service_id, ps.experience_years, ps.service_charge, 
                   s.service_name, s.description 
            FROM provider_services ps 
            JOIN services s ON ps.service_id = s.service_id 
            WHERE ps.provider_id = %s AND ps.is_available = 1
            """,
            (provider_id,)
        )
        services = cursor.fetchall()
        for s in services:
            if s.get("service_charge"):
                s["service_charge"] = float(s["service_charge"])
                
        provider["services"] = services
        
        # Get reviews
        cursor.execute(
            """
            SELECT r.*, c.full_name as customer_name 
            FROM reviews r 
            JOIN customers c ON r.customer_id = c.customer_id 
            WHERE r.provider_id = %s 
            ORDER BY r.created_at DESC
            """,
            (provider_id,)
        )
        reviews = cursor.fetchall()
        cursor.close()
        conn.close()
        
        for r in reviews:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
            if r.get("updated_at"):
                r["updated_at"] = r["updated_at"].isoformat()
            if r.get("reply_date"):
                r["reply_date"] = r["reply_date"].isoformat()
                
        provider["reviews"] = reviews
        
        if provider.get("average_rating"):
            provider["average_rating"] = float(provider["average_rating"])
            
        return jsonify({"status": True, "provider": provider}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)