from flask import Blueprint, request, jsonify
import datetime
import secrets
import bcrypt
import os
from database.db import get_connection
from utils.password import hash_password, verify_password
from utils.validators import validate_email, validate_phone, validate_password, validate_pincode
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token
)
from utils.email import send_email_async

customer_auth_bp = Blueprint("customer_auth", __name__)

@customer_auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")
        gender = data.get("gender")
        date_of_birth = data.get("date_of_birth") # YYYY-MM-DD
        profile_image = data.get("profile_image")
        address = data.get("address")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")

        if not full_name or not email or not password:
            return jsonify({"status": False, "message": "Full Name, Email and Password are required."}), 400

        if not validate_email(email):
            return jsonify({"status": False, "message": "Invalid email format."}), 400

        if not validate_password(password):
            return jsonify({"status": False, "message": "Password must be at least 8 characters long and contain both letters and numbers."}), 400

        if phone and not validate_phone(phone):
            return jsonify({"status": False, "message": "Invalid phone number format."}), 400

        if pincode and not validate_pincode(pincode):
            return jsonify({"status": False, "message": "Invalid pincode format."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check unique email
        cursor.execute("SELECT customer_id FROM customers WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email already registered."}), 409

        # Check unique phone
        if phone:
            cursor.execute("SELECT customer_id FROM customers WHERE phone = %s", (phone,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": "Phone number already registered."}), 409

        # Hash password and insert
        hashed = hash_password(password)
        
        insert_query = """
            INSERT INTO customers 
            (full_name, email, password_hash, phone, gender, date_of_birth, profile_image, address, city, state, pincode, status, email_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Active', 0)
        """
        cursor.execute(insert_query, (
            full_name, email, hashed, phone, gender, 
            date_of_birth or None, profile_image, address, city, state, pincode
        ))
        conn.commit()

        # Email Verification Token
        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        
        cursor.execute(
            "INSERT INTO email_verification_tokens (email, verification_token, expires_at, verified) VALUES (%s, %s, %s, 0)",
            (email, verification_token, expires_at)
        )
        conn.commit()

        # Send Email
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        verify_link = f"{frontend_url}/verify-email?token={verification_token}"
        email_subject = "Verify Your Local Service Booking Account"
        email_body = f"""
            <h2>Verify Your Email</h2>
            <p>Hi {full_name},</p>
            <p>Thank you for registering. Please verify your account by clicking the link below:</p>
            <a href="{verify_link}" style="padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">Verify Email</a>
            <p>Or copy this link in your browser: {verify_link}</p>
            <p>Expires in 24 hours.</p>
        """
        send_email_async(email, email_subject, email_body)

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Customer registered successfully. Check email for verification link."
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/login", methods=["POST"])
print("Rows affected:", cursor.rowcount)

cursor.execute(
    "SELECT customer_id, email FROM customers WHERE email=%s",
    (email,)
)
print("Verification:", cursor.fetchone())
@customer_auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"status": False, "message": "Email and password are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customers WHERE email = %s", (email,))
        customer = cursor.fetchone()

        if not customer:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}), 401

        # Check status
        if customer["status"] == "Blocked":
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Your account has been suspended."}), 403

        # Check verification status
        if not customer["email_verified"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Please verify your email before logging in."}), 403

        # Verify password
        if not verify_password(password, customer["password_hash"]):
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}), 401

        # Update last login
        cursor.execute("UPDATE customers SET last_login = %s WHERE customer_id = %s", (datetime.datetime.utcnow(), customer["customer_id"]))
        conn.commit()

        # Tokens
        access = generate_access_token(customer["customer_id"], customer["email"], "Customer")
        refresh = generate_and_save_refresh_token(customer["customer_id"], "Customer")

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Login successful.",
            "access_token": access,
            "refresh_token": refresh,
            "token": access,  # Compat
            "user": {
                "customer_id": customer["customer_id"],
                "full_name": customer["full_name"],
                "email": customer["email"]
            }
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/verify-email", methods=["GET", "POST"])
def verify_email():
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

        cursor.execute("SELECT * FROM email_verification_tokens WHERE verification_token = %s", (token,))
        record = cursor.fetchone()

        if not record or record["verified"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid or already verified token."}), 400

        if record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Verification token has expired."}), 400

        # Mark token verified
        cursor.execute(
            "UPDATE email_verification_tokens SET verified = 1 WHERE token_id = %s",
            (record["token_id"],)
        )
        # Update customer table
        cursor.execute(
            "UPDATE customers SET email_verified = 1 WHERE email = %s",
            (record["email"],)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Email verified successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get("email")

        if not email:
            return jsonify({"status": False, "message": "Email is required."}), 400

        success_response = jsonify({
            "status": True,
            "message": "If the email is registered, a password reset link has been sent."
        })

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT customer_id, full_name FROM customers WHERE email = %s", (email,))
        customer = cursor.fetchone()

        if not customer:
            cursor.close()
            conn.close()
            return success_response, 200

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)

        cursor.execute(
            "INSERT INTO password_reset_tokens (email, reset_token, expires_at, used) VALUES (%s, %s, %s, 0)",
            (email, reset_token, expires_at)
        )
        conn.commit()

        # Send Reset Link
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        email_subject = "Reset Your Account Password"
        email_body = f"""
            <h2>Password Reset</h2>
            <p>Hi {customer['full_name']},</p>
            <p>You requested a password reset. Click below to proceed:</p>
            <a href="{reset_link}" style="padding:10px 20px; background-color:#2563eb; color:white; text-decoration:none; border-radius:5px;">Reset Password</a>
            <p>Or paste this in your browser: {reset_link}</p>
            <p>Expires in 30 minutes.</p>
        """
        send_email_async(email, email_subject, email_body)

        cursor.close()
        conn.close()
        return success_response, 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json() or {}
        token = data.get("token")
        new_password = data.get("new_password")

        if not token or not new_password:
            return jsonify({"status": False, "message": "Token and new password are required."}), 400

        if not validate_password(new_password):
            return jsonify({"status": False, "message": "Password must be at least 8 characters long and contain both letters and numbers."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM password_reset_tokens WHERE reset_token = %s", (token,))
        record = cursor.fetchone()

        if not record or record["used"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid or already used token."}), 400

        if record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Reset token has expired."}), 400

        # Mark token as used
        cursor.execute("UPDATE password_reset_tokens SET used = 1 WHERE token_id = %s", (record["token_id"],))
        
        # Update user password
        hashed = hash_password(new_password)
        cursor.execute("UPDATE customers SET password_hash = %s WHERE email = %s", (hashed, record["email"]))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Password reset successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/refresh-token", methods=["POST"])
def refresh_token():
    try:
        data = request.get_json() or {}
        token = data.get("refresh_token")

        if not token:
            return jsonify({"status": False, "message": "Refresh token is required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Retrieve token record
        cursor.execute("SELECT * FROM refresh_tokens WHERE refresh_token = %s", (token,))
        record = cursor.fetchone()

        if not record or record["revoked"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid or revoked refresh token."}), 401

        if record["expires_at"] < datetime.datetime.utcnow():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Expired refresh token."}), 401

        # Check customer ID
        if not record["customer_id"]:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Refresh token mismatch."}), 401

        cursor.execute("SELECT email, status FROM customers WHERE customer_id = %s", (record["customer_id"],))
        customer = cursor.fetchone()

        if not customer or customer["status"] == "Blocked":
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "User inactive or blocked."}), 401

        # Generate new access token
        access = generate_access_token(record["customer_id"], customer["email"], "Customer")

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Token refreshed successfully.",
            "access_token": access,
            "token": access
        }), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500

@customer_auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        data = request.get_json() or {}
        token = data.get("refresh_token")

        if token:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM refresh_tokens WHERE refresh_token = %s", (token,))
            conn.commit()
            cursor.close()
            conn.close()

        return jsonify({"status": True, "message": "Logged out successfully."}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500
