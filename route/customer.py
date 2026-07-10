from flask import Blueprint, request, jsonify, g, redirect
from database.db import get_connection
import bcrypt
import datetime
import os
import secrets
from utils.email import send_email_async
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)

customer_bp = Blueprint("customer", __name__)

@customer_bp.route("/api/customer/register", methods=["POST"])
def register_customer():

    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")
    address = data.get("address")
    city = data.get("city")
    pincode = data.get("pincode")

    # Check required fields
    if not full_name or not email or not password:
        return jsonify({
            "status": False,
            "message": "Full Name, Email and Password are required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()

    if user:
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "Email already exists."
        }), 409

    # Encrypt password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Insert new user
    verification_token = secrets.token_urlsafe(32)
    verification_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    query = """
    INSERT INTO users
    (full_name,email,password,phone,address,city,pincode,email_verified,verification_token,verification_token_expiry)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    values = (
        full_name,
        email,
        hashed_password.decode('utf-8'),
        phone,
        address,
        city,
        pincode,
        0, # email_verified is False for new registrations
        verification_token,
        verification_expiry
    )

    cursor.execute(query, values)
    conn.commit()

    # Send verification email asynchronously
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:5000")
    verification_link = f"{backend_url}/api/customer/verify-email?token={verification_token}"
    
    email_subject = "Verify Your Fixora Account"
    email_body = f"""
    <h2>Welcome to Fixora!</h2>
    <p>Dear {full_name},</p>
    <p>Thank you for registering. Please verify your email by clicking the link below:</p>
    <p><a href="{verification_link}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;">Verify Email</a></p>
    <p>Or copy and paste this link in your browser:</p>
    <p>{verification_link}</p>
    <p>This link is valid for 24 hours.</p>
    <br/>
    <p>Best regards,<br/>The Fixora Team</p>
    """
    
    send_email_async(email, email_subject, email_body)

    cursor.close()
    conn.close()

    return jsonify({
        "status": True,
        "message": "Customer Registered Successfully. Please check your email to verify your account."
    }), 201



@customer_bp.route("/api/customer/login", methods=["POST"])
def login_customer():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "status": False,
            "message": "Email and Password are required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email=%s",
        (email,)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "User not found."
        }), 404

    # Verify email verification
    if not user.get("email_verified"):
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Please verify your email before logging in."
        }), 403

    # Compare password
    if not bcrypt.checkpw(
        password.encode("utf-8"),
        user["password"].encode("utf-8")
    ):
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "Invalid Password."
        }), 401

    # Generate access and refresh tokens
    access_token = generate_access_token(user["user_id"], user["email"], "customer")
    refresh_token = generate_and_save_refresh_token(user["user_id"])

    cursor.close()
    conn.close()

    return jsonify({
        "status": True,
        "message": "Login Successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token": access_token, # Legacy token compatibility
        "user": {
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"]
        }
    }), 200


@customer_bp.route("/api/customer/verify-email", methods=["GET", "POST"])
def verify_customer_email():
    token = None
    if request.method == "POST":
        data = request.get_json() or {}
        token = data.get("token")
    else:
        token = request.args.get("token")

    if not token:
        return jsonify({
            "status": False,
            "message": "Verification token is required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT user_id, verification_token_expiry FROM users WHERE verification_token = %s",
        (token,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Invalid email verification token."
        }), 400

    # Check expiry
    expiry = user["verification_token_expiry"]
    if expiry and expiry < datetime.datetime.utcnow():
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Email verification token has expired."
        }), 400

    # Mark as verified
    cursor.execute(
        "UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expiry = NULL WHERE user_id = %s",
        (user["user_id"],)
    )
    conn.commit()

    cursor.close()
    conn.close()

    # If browser GET request, redirect to frontend login page
    if request.method == "GET":
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/customer/login?verified=true")

    return jsonify({
        "status": True,
        "message": "Email verified successfully."
    }), 200


@customer_bp.route("/api/customer/forgot-password", methods=["POST"])
def customer_forgot_password():
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({
            "status": False,
            "message": "Email is required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if user exists
    cursor.execute("SELECT user_id, full_name FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    # Success message matches standard security guidelines to prevent enumeration
    success_response = jsonify({
        "status": True,
        "message": "If the email is registered, a password reset link has been sent."
    })

    if not user:
        cursor.close()
        conn.close()
        return success_response, 200

    # Generate password reset token
    reset_token = secrets.token_urlsafe(32)
    reset_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)

    # Update database
    cursor.execute(
        "UPDATE users SET password_reset_token = %s, password_reset_expiry = %s WHERE user_id = %s",
        (reset_token, reset_expiry, user["user_id"])
    )
    conn.commit()
    cursor.close()
    conn.close()

    # Send reset link asynchronously
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    email_subject = "Reset Your Fixora Password"
    email_body = f"""
    <h2>Password Reset Request</h2>
    <p>Dear {user['full_name']},</p>
    <p>We received a request to reset your password. Click the button below to update it:</p>
    <p><a href="{reset_link}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p>
    <p>Or copy and paste this link in your browser:</p>
    <p>{reset_link}</p>
    <p>This reset link will expire in 30 minutes.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <br/>
    <p>Best regards,<br/>The Fixora Team</p>
    """

    send_email_async(email, email_subject, email_body)

    return success_response, 200


@customer_bp.route("/api/customer/reset-password", methods=["POST"])
def customer_reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({
            "status": False,
            "message": "Token and new password are required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Find user by reset token
    cursor.execute(
        "SELECT user_id, password_reset_expiry FROM users WHERE password_reset_token = %s",
        (token,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Invalid password reset token."
        }), 400

    # Validate expiry
    expiry = user["password_reset_expiry"]
    if expiry and expiry < datetime.datetime.utcnow():
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Password reset token has expired."
        }), 400

    # Hash new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Update user password and clear token columns
    cursor.execute(
        "UPDATE users SET password = %s, password_reset_token = NULL, password_reset_expiry = NULL WHERE user_id = %s",
        (hashed_password, user["user_id"])
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        "status": True,
        "message": "Password reset successfully."
    }), 200


@customer_bp.route("/api/customer/refresh-token", methods=["POST"])
def customer_refresh_token():
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")

    if not refresh_token:
        return jsonify({
            "status": False,
            "message": "Refresh token is required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check refresh token validity
    cursor.execute(
        "SELECT user_id, expires_at FROM refresh_tokens WHERE token = %s",
        (refresh_token,)
    )
    token_record = cursor.fetchone()

    if not token_record:
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Invalid refresh token."
        }), 401

    # Check expiry
    if token_record["expires_at"] < datetime.datetime.utcnow():
        # Delete expired token
        cursor.execute("DELETE FROM refresh_tokens WHERE token = %s", (refresh_token,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Expired refresh token."
        }), 401

    # Retrieve user information
    cursor.execute(
        "SELECT user_id, email FROM users WHERE user_id = %s",
        (token_record["user_id"],)
    )
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({
            "status": False,
            "message": "User associated with token not found."
        }), 401

    # Generate new access token
    access_token = generate_access_token(user["user_id"], user["email"], "customer")

    return jsonify({
        "status": True,
        "message": "Access token refreshed successfully.",
        "access_token": access_token,
        "token": access_token
    }), 200


@customer_bp.route("/api/customer/logout", methods=["POST"])
def customer_logout():
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")

    if refresh_token:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM refresh_tokens WHERE token = %s", (refresh_token,))
        conn.commit()
        cursor.close()
        conn.close()

    return jsonify({
        "status": True,
        "message": "Logged out successfully."
    }), 200


@customer_bp.route("/api/customer/profile", methods=["GET"])
@token_required
def get_customer_profile():
    # g.current_user is populated by token_required decorator
    user_payload = g.current_user
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT user_id, full_name, email, phone, address, city, pincode, created_at FROM users WHERE user_id = %s",
        (user_payload["user_id"],)
    )
    user_details = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user_details:
        return jsonify({
            "status": False,
            "message": "User details not found."
        }), 404

    # Convert datetime to string
    if user_details.get("created_at"):
        user_details["created_at"] = user_details["created_at"].isoformat()

    return jsonify({
        "status": True,
        "message": "Profile fetched successfully.",
        "user": user_details
    }), 200