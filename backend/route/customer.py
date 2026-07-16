from flask import Blueprint, request, jsonify, g
from database.db import get_connection
import bcrypt
import datetime
import os
import secrets
import random
from utils.email import send_email_async
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)

customer_bp = Blueprint("customer", __name__)

# ====================================================
# CUSTOMER AUTHENTICATION
# ====================================================

@customer_bp.route("/api/customer/register", methods=["POST"])
def register_customer():
    try:
        data = request.get_json() or {}
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
            }), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check duplicate email
        cursor.execute("SELECT customer_id FROM customers WHERE email=%s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email already exists."}), 409

        # Check duplicate phone
        if phone:
            cursor.execute("SELECT customer_id FROM customers WHERE phone=%s", (phone,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": "Phone number already registered."}), 400

        # Hash Password
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Insert Customer - Register directly with Active status and email_verified = 1
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
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/verify-email", methods=["GET", "POST"])
def verify_customer_email():
    try:
        token = None
        if request.method == "POST":
            data = request.get_json() or {}
            token = data.get("token")
        else:
            token = request.args.get("token")

        if not token:
            return jsonify({"status": False, "message": "Verification token is required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT email, expires_at FROM email_verification_tokens WHERE otp_code = %s AND verified = 0 LIMIT 1",
            (token,)
        )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email verification token."}), 400

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email verification token has expired."}), 400

        # Mark token as verified
        cursor.execute(
            "UPDATE email_verification_tokens SET verified = 1 WHERE otp_code = %s",
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
            return jsonify({"status": True, "message": "Email verified successfully."}), 200
        else:
            frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
            from flask import redirect
            return redirect(f"{frontend_url}/email-verified")

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/login", methods=["POST"])
def login_customer():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"status": False, "message": "Email and Password are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customers WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "User not found."}), 404

        if not user["email_verified"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Please verify your email before logging in."}), 403

        if user["status"] == "Blocked":
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Your account has been suspended."}), 403

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid Password."}), 401

        # Generate tokens
        access_token = generate_access_token(user["customer_id"], user["email"], "customer")
        refresh_token = generate_and_save_refresh_token(user["customer_id"], "customer")

        # Update last login
        cursor.execute("UPDATE customers SET last_login = NOW() WHERE customer_id = %s", (user["customer_id"],))
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
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/forgot-password", methods=["POST"])
def customer_forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        if not email:
            return jsonify({"status": False, "message": "Email is required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT customer_id, full_name FROM customers WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email not found."}), 404

        # Generate Secure 6 Digit OTP
        otp = f"{random.randint(100000, 999999)}"
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

        # Store OTP inside password_reset_tokens.otp_code
        cursor.execute(
            "INSERT INTO password_reset_tokens (email, otp_code, expires_at, is_used) VALUES (%s, %s, %s, 0)",
            (email, otp, expires_at)
        )
        conn.commit()

        # Send OTP via SMTP
        email_subject = "Password Reset OTP Code"
        email_body = f"""
            <h2>Password Reset Request</h2>
            <p>Hi {user['full_name']},</p>
            <p>You requested to reset your password. Use the following 6-digit OTP code to verify your request:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2563eb; padding: 10px; background-color: #f3f4f6; display: inline-block; border-radius: 5px; margin: 10px 0;">{otp}</div>
            <p>This code expires in 10 minutes.</p>
        """
        send_email_async(email, email_subject, email_body)

        cursor.close()
        conn.close()
        return jsonify({
            "status": True,
            "message": "OTP has been sent to your email address."
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/verify-otp", methods=["POST"])
def verify_customer_otp():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        otp_code = data.get("otp_code")

        if not email or not otp_code:
            return jsonify({"status": False, "message": "Email and OTP code are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT email, expires_at FROM password_reset_tokens WHERE email = %s AND otp_code = %s AND is_used = 0 LIMIT 1",
            (email, otp_code)
        )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid OTP code."}), 400

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "OTP code has expired."}), 400

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "OTP verified successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/reset-password", methods=["POST"])
def customer_reset_password():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        otp_code = data.get("otp_code")
        new_password = data.get("new_password")

        if not email or not otp_code or not new_password:
            return jsonify({"status": False, "message": "Email, OTP code and new password are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT email, expires_at FROM password_reset_tokens WHERE email = %s AND otp_code = %s AND is_used = 0 LIMIT 1",
            (email, otp_code)
        )
        token_record = cursor.fetchone()

        if not token_record:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid OTP code."}), 400

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "OTP code has expired."}), 400

        # Hash new password
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Update customer password
        cursor.execute(
            "UPDATE customers SET password_hash = %s WHERE email = %s",
            (hashed_password, email)
        )
        # Mark token as used
        cursor.execute(
            "UPDATE password_reset_tokens SET is_used = 1 WHERE email = %s AND otp_code = %s",
            (email, otp_code)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Password reset successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/refresh-token", methods=["POST"])
def customer_refresh_token():
    try:
        data = request.get_json() or {}
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return jsonify({"status": False, "message": "Refresh token is required."}), 400

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
            return jsonify({"status": False, "message": "Invalid refresh token."}), 401

        if token_record["expires_at"] < datetime.datetime.utcnow():
            cursor.execute("DELETE FROM refresh_tokens WHERE refresh_token = %s", (refresh_token,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Expired refresh token."}), 401

        # Fetch customer email
        cursor.execute("SELECT email FROM customers WHERE customer_id = %s", (token_record["customer_id"],))
        customer = cursor.fetchone()

        cursor.close()
        conn.close()

        if not customer:
            return jsonify({"status": False, "message": "Customer associated with token not found."}), 401

        access_token = generate_access_token(token_record["customer_id"], customer["email"], "customer")

        return jsonify({
            "status": True,
            "message": "Access token refreshed successfully.",
            "access_token": access_token,
            "token": access_token
        }), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/logout", methods=["POST"])
def customer_logout():
    try:
        data = request.get_json() or {}
        refresh_token = data.get("refresh_token")
        if refresh_token:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM refresh_tokens WHERE refresh_token = %s", (refresh_token,))
            conn.commit()
            cursor.close()
            conn.close()

        return jsonify({"status": True, "message": "Logged out successfully."}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# CUSTOMER PROFILE
# ====================================================

@customer_bp.route("/api/customer/profile", methods=["GET"])
@token_required
def get_customer_profile():
    try:
        user_payload = g.current_user
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
            return jsonify({"status": False, "message": "Customer not found."}), 404

        if customer.get("created_at"):
            customer["created_at"] = customer["created_at"].isoformat()
        if customer.get("date_of_birth"):
            customer["date_of_birth"] = customer["date_of_birth"].isoformat()

        return jsonify({
            "status": True,
            "message": "Profile fetched successfully.",
            "user": customer
        }), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/customer/profile", methods=["PUT"])
@token_required
def update_customer_profile():
    try:
        user_payload = g.current_user
        data = request.get_json() or {}

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Get existing details
        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (user_payload["user_id"],))
        customer = cursor.fetchone()

        if not customer:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}), 404

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
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# CATEGORIES & SERVICES (PUBLIC)
# ====================================================

@customer_bp.route("/api/category", methods=["GET"])
def list_categories():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categories WHERE status='Active'")
        categories = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "categories": categories}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/service", methods=["GET"])
def list_services():
    try:
        category_id = request.args.get("category_id")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        if category_id:
            cursor.execute("SELECT * FROM services WHERE category_id = %s AND status='Active'", (category_id,))
        else:
            cursor.execute("SELECT * FROM services WHERE status='Active'")
        
        services = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "services": services}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# BOOKINGS
# ====================================================

@customer_bp.route("/api/booking", methods=["POST"])
@token_required
def create_booking():
    try:
        user_payload = g.current_user
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Only customers can create bookings."}), 403

        data = request.get_json() or {}
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
            return jsonify({"status": False, "message": "Missing required booking details."}), 400

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
                return jsonify({"status": False, "message": "Service not found."}), 404
            price = s["estimated_price"]

        # Generate unique booking number
        bk_num = f"BK-{datetime.datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

        query = """
        INSERT INTO bookings
        (booking_number, customer_id, provider_id, service_id, booking_date, booking_time, service_address, city, state, pincode, problem_description, estimated_price, booking_status, payment_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Pending', 'Pending')
        """
        cursor.execute(query, (bk_num, user_payload["user_id"], provider_id, service_id, booking_date, booking_time, service_address, city, state, pincode, problem_description, price))
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

        # Send Booking Confirmation Email
        try:
            cursor.execute("SELECT full_name, email FROM customers WHERE customer_id = %s LIMIT 1", (user_payload["user_id"],))
            cust = cursor.fetchone()
            customer_name = cust["full_name"] if cust else "Customer"
            customer_email = cust["email"] if cust else ""

            cursor.execute("SELECT service_name FROM services WHERE service_id = %s LIMIT 1", (service_id,))
            svc = cursor.fetchone()
            service_name = svc["service_name"] if svc else "Service"

            if customer_email:
                email_subject = "Booking Confirmation - Fixora"
                email_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Booking Confirmation</h2>
                    <p>Dear {customer_name},</p>
                    <p>Thank you for your booking request. Here are the details of your booking confirmation:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold; width: 150px;">Booking Number:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">{bk_num}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Service Name:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">{service_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Date:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">{booking_date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Time:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">{booking_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Address:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">{service_address}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Status:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; color: #d97706; font-weight: bold;">Pending</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Estimated Price:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: #16a34a;">₹{price}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px; font-size: 12px; color: #777777; text-align: center;">This is an automated confirmation email. Please do not reply directly to this email.</p>
                </div>
                """
                send_email_async(customer_email, email_subject, email_body)
        except Exception as email_err:
            print("Failed to send booking confirmation email:", email_err)

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
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/booking/history", methods=["GET"])
@token_required
def get_customer_booking_history():
    try:
        user_payload = g.current_user
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}), 403

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

        return jsonify({"status": True, "bookings": bookings}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/booking/<int:booking_id>/cancel", methods=["POST"])
@token_required
def cancel_booking(booking_id):
    try:
        user_payload = g.current_user
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}), 403

        data = request.get_json() or {}
        reason = data.get("reason", "Cancelled by customer")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}), 404

        if booking["booking_status"] in ['Completed', 'Cancelled', 'Rejected']:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking cannot be cancelled in its current state."}), 400

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

        return jsonify({"status": True, "message": "Booking cancelled successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# REVIEWS
# ====================================================

@customer_bp.route("/api/review", methods=["POST"])
@token_required
def create_review():
    try:
        user_payload = g.current_user
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}), 403

        data = request.get_json() or {}
        booking_id = data.get("booking_id")
        rating = data.get("rating")
        review_text = data.get("review_text")

        if not booking_id or not rating:
            return jsonify({"status": False, "message": "Booking ID and Rating are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check booking
        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}), 404

        if booking["booking_status"] != 'Completed':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Reviews can only be written for completed bookings."}), 400

        # Check existing review
        cursor.execute("SELECT review_id FROM reviews WHERE booking_id = %s", (booking_id,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Review already exists for this booking."}), 400

        # Insert Review
        cursor.execute(
            "INSERT INTO reviews (booking_id, customer_id, provider_id, rating, review_text) VALUES (%s, %s, %s, %s, %s)",
            (booking_id, user_payload["user_id"], booking["provider_id"], rating, review_text)
        )
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

        cursor.close()
        conn.close()

        return jsonify({"status": True, "message": "Review submitted successfully."}), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/review/provider/<int:provider_id>", methods=["GET"])
def get_provider_reviews(provider_id):
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

        return jsonify({"status": True, "reviews": reviews}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# PAYMENTS
# ====================================================

@customer_bp.route("/api/payment/create", methods=["POST"])
@token_required
def create_payment():
    try:
        user_payload = g.current_user
        if user_payload["role"] != "customer":
            return jsonify({"status": False, "message": "Unauthorized."}), 403

        data = request.get_json() or {}
        booking_id = data.get("booking_id")

        if not booking_id:
            return jsonify({"status": False, "message": "Booking ID is required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND customer_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}), 404

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

        return jsonify({"status": True, "message": "Payment successful."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/payment/<int:booking_id>/status", methods=["GET"])
def get_payment_status(booking_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT booking_id, payment_status, estimated_price, final_price FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()
        cursor.close()
        conn.close()

        if not booking:
            return jsonify({"status": False, "message": "Booking not found."}), 404

        if booking.get("estimated_price"):
            booking["estimated_price"] = float(booking["estimated_price"])
        if booking.get("final_price"):
            booking["final_price"] = float(booking["final_price"])

        return jsonify({"status": True, "payment": booking}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/payment/history", methods=["GET"])
@token_required
def get_payment_history():
    try:
        user_payload = g.current_user
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

        return jsonify({"status": True, "payments": payments}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# NOTIFICATIONS
# ====================================================

@customer_bp.route("/api/notification", methods=["GET"])
@token_required
def list_notifications():
    try:
        user_payload = g.current_user
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

        return jsonify({"status": True, "notifications": notifications}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/notification/<int:notification_id>/read", methods=["PUT"])
@token_required
def mark_notification_read(notification_id):
    try:
        user_payload = g.current_user
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
            return jsonify({"status": False, "message": "Notification not found."}), 404

        cursor.execute("UPDATE notifications SET is_read = 1 WHERE notification_id = %s", (notification_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Notification marked as read."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# CUSTOMER PROVIDER LIST & DETAILS (DIRECTORY)
# ====================================================

@customer_bp.route("/api/provider", methods=["GET"])
def customer_list_providers():
    try:
        category_id = request.args.get("category_id")
        city = request.args.get("city")
        
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT provider_id, business_name, full_name, email, phone,
               profile_image, address, city, state, pincode, experience_years,
               average_rating, total_reviews, status
        FROM providers
        WHERE status = 'Approved' AND email_verified = 1
        """
        params = []
        if city:
            query += " AND city = %s"
            params.append(city)
            
        cursor.execute(query, tuple(params))
        providers = cursor.fetchall()
        cursor.close()
        conn.close()

        for p in providers:
            p["full_name"] = p.get("full_name") or p.get("business_name") or ""
            if p.get("average_rating"):
                p["average_rating"] = float(p["average_rating"])

        return jsonify({"status": True, "providers": providers}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@customer_bp.route("/api/provider/<int:provider_id>", methods=["GET"])
def customer_get_provider_details(provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            """
            SELECT provider_id, business_name, full_name, email, phone,
                   profile_image, address, city, state, pincode, experience_years,
                   average_rating, total_reviews, status
            FROM providers
            WHERE provider_id = %s
            """,
            (provider_id,)
        )
        provider = cursor.fetchone()
        
        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}), 404
            
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
            
        return jsonify({"status": True, "provider": provider}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500