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
provider_bp = Blueprint("provider", __name__)

@provider_bp.route("/api/provider/register", methods=["POST"])
def register_provider():

    data = request.get_json()

    # User Details
    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")
    address = data.get("address")
    city = data.get("city")       # city string from frontend
    pincode = data.get("pincode")

    # Provider Details - accept either IDs (legacy) or string names from frontend
    category_id = data.get("category_id")
    location_id = data.get("location_id")
    service_name = data.get("service")       # string name from frontend dropdown
    city_name = data.get("city")             # used for location lookup too
    business_name = data.get("business_name")
    experience = data.get("experience")
    description = data.get("description")
    price_per_hour = data.get("price_per_hour")
    availability = data.get("availability")
    profile_image = data.get("profile_image")

    # Required fields
    if not full_name or not email or not password:
        return jsonify({
            "status": False,
            "message": "Full Name, Email and Password are required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Resolve category_id from service name if not provided directly
    if not category_id and service_name:
        cursor.execute("SELECT category_id FROM categories WHERE category_name = %s", (service_name,))
        cat_row = cursor.fetchone()
        if cat_row:
            category_id = cat_row["category_id"]
        else:
            # Create the category if it doesn't exist
            cursor.execute("INSERT INTO categories (category_name) VALUES (%s)", (service_name,))
            conn.commit()
            category_id = cursor.lastrowid

    # Resolve location_id from city name if not provided directly
    if not location_id and city_name:
        cursor.execute("SELECT location_id FROM locations WHERE city = %s LIMIT 1", (city_name,))
        loc_row = cursor.fetchone()
        if loc_row:
            location_id = loc_row["location_id"]
        else:
            # Create a minimal location entry using the city name
            cursor.execute(
                "INSERT INTO locations (city, area, state, pincode) VALUES (%s, %s, %s, %s)",
                (city_name, city_name, city_name, pincode or "000000")
            )
            conn.commit()
            location_id = cursor.lastrowid

    # Fall back to non-dictionary cursor for the duplicate email check
    cursor2 = conn.cursor()

    # Check duplicate email
    cursor2.execute(
        "SELECT * FROM users WHERE email=%s",
        (email,)
    )

    existing = cursor2.fetchone()

    if existing:
        cursor2.close()
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "Email already exists."
        }), 409

    # Hash Password
    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    verification_expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=24)

    # Insert into users
    user_query = """
    INSERT INTO users
    (full_name,email,password,phone,address,city,pincode,email_verified,verification_token,verification_token_expiry)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    user_values = (
        full_name,
        email,
        hashed_password.decode("utf-8"),
        phone,
        address,
        city,
        pincode,
        0, # email_verified is False for new registrations
        verification_token,
        verification_expiry
    )

    cursor2.execute(user_query, user_values)

    # Get generated user_id
    user_id = cursor2.lastrowid

    # Set business_name from full_name if not provided
    if not business_name:
        business_name = full_name

    # Insert into service_providers
    provider_query = """
    INSERT INTO service_providers
    (user_id,category_id,location_id,business_name,
    experience,description,price_per_hour,
    availability,profile_image)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    provider_values = (
        user_id,
        category_id,
        location_id,
        business_name,
        experience,
        description,
        price_per_hour,
        availability,
        profile_image
    )

    cursor2.execute(provider_query, provider_values)

    conn.commit()

    # Send verification email asynchronously
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:5000")
    verification_link = f"{backend_url}/api/provider/verify-email?token={verification_token}"
    
    email_subject = "Verify Your Fixora Provider Account"
    email_body = f"""
    <h2>Welcome to Fixora!</h2>
    <p>Dear {full_name},</p>
    <p>Thank you for registering as a Service Provider. Please verify your email by clicking the link below:</p>
    <p><a href="{verification_link}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;">Verify Email</a></p>
    <p>Or copy and paste this link in your browser:</p>
    <p>{verification_link}</p>
    <p>This link is valid for 24 hours.</p>
    <br/>
    <p>Best regards,<br/>The Fixora Team</p>
    """
    
    send_email_async(email, email_subject, email_body)

    cursor2.close()
    cursor.close()
    conn.close()

    return jsonify({
        "status": True,
        "message": "Service Provider Registered Successfully. Please check your email to verify your account."
    }), 201


@provider_bp.route("/api/provider/login", methods=["POST"])
def login_provider():

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

    # Find provider using email
    query = """
    SELECT
        u.user_id,
        u.full_name,
        u.email,
        u.password,
        u.email_verified,
        sp.provider_id,
        sp.business_name,
        sp.category_id,
        sp.location_id,
        sp.experience,
        sp.description,
        sp.price_per_hour,
        sp.availability,
        sp.profile_image,
        sp.rating
    FROM users u
    INNER JOIN service_providers sp
        ON u.user_id = sp.user_id
    WHERE u.email = %s
    """

    cursor.execute(query, (email,))
    provider = cursor.fetchone()

    if not provider:
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "Service Provider not found."
        }), 404

    # Verify email verification
    if not provider.get("email_verified"):
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Please verify your email before logging in."
        }), 403

    # Verify password
    if not bcrypt.checkpw(
        password.encode("utf-8"),
        provider["password"].encode("utf-8")
    ):
        cursor.close()
        conn.close()

        return jsonify({
            "status": False,
            "message": "Invalid Password."
        }), 401

    # Generate tokens
    access_token = generate_access_token(
        provider["user_id"],
        provider["email"],
        "provider",
        provider_id=provider["provider_id"]
    )
    refresh_token = generate_and_save_refresh_token(provider["user_id"])

    cursor.close()
    conn.close()

    return jsonify({
        "status": True,
        "message": "Service Provider Login Successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token": access_token, # Legacy token compatibility
        "provider": {
            "provider_id": provider["provider_id"],
            "user_id": provider["user_id"],
            "full_name": provider["full_name"],
            "email": provider["email"],
            "business_name": provider["business_name"],
            "category_id": provider["category_id"],
            "location_id": provider["location_id"],
            "experience": provider["experience"],
            "description": provider["description"],
            "price_per_hour": float(provider["price_per_hour"]) if provider["price_per_hour"] else None,
            "availability": provider["availability"],
            "profile_image": provider["profile_image"],
            "rating": float(provider["rating"]) if provider["rating"] else 0
        }
    }), 200


@provider_bp.route("/api/provider/verify-email", methods=["GET", "POST"])
def verify_provider_email():
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
    # Use dictionary cursor to find the user in users table
    cursor = conn.cursor(dictionary=True)

    # Make sure this user is actually a provider to prevent cross-login verification mismatch
    query = """
    SELECT u.user_id, u.verification_token_expiry FROM users u
    INNER JOIN service_providers sp ON u.user_id = sp.user_id
    WHERE u.verification_token = %s
    """
    cursor.execute(query, (token,))
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

    # If browser GET request, redirect to frontend provider login page
    if request.method == "GET":
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/provider/login?verified=true")

    return jsonify({
        "status": True,
        "message": "Email verified successfully."
    }), 200


@provider_bp.route("/api/provider/forgot-password", methods=["POST"])
def provider_forgot_password():
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({
            "status": False,
            "message": "Email is required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if provider exists
    query = """
    SELECT u.user_id, u.full_name FROM users u
    INNER JOIN service_providers sp ON u.user_id = sp.user_id
    WHERE u.email = %s
    """
    cursor.execute(query, (email,))
    user = cursor.fetchone()

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

    email_subject = "Reset Your Fixora Provider Password"
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


@provider_bp.route("/api/provider/reset-password", methods=["POST"])
def provider_reset_password():
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

    # Find provider by reset token
    query = """
    SELECT u.user_id, u.password_reset_expiry FROM users u
    INNER JOIN service_providers sp ON u.user_id = sp.user_id
    WHERE u.password_reset_token = %s
    """
    cursor.execute(query, (token,))
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


@provider_bp.route("/api/provider/refresh-token", methods=["POST"])
def provider_refresh_token():
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
        cursor.execute("DELETE FROM refresh_tokens WHERE token = %s", (refresh_token,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({
            "status": False,
            "message": "Expired refresh token."
        }), 401

    # Retrieve provider user information
    query = """
    SELECT u.user_id, u.email, sp.provider_id FROM users u
    INNER JOIN service_providers sp ON u.user_id = sp.user_id
    WHERE u.user_id = %s
    """
    cursor.execute(query, (token_record["user_id"],))
    provider = cursor.fetchone()

    cursor.close()
    conn.close()

    if not provider:
        return jsonify({
            "status": False,
            "message": "Service provider associated with token not found."
        }), 401

    # Generate new access token
    access_token = generate_access_token(
        provider["user_id"],
        provider["email"],
        "provider",
        provider_id=provider["provider_id"]
    )

    return jsonify({
        "status": True,
        "message": "Access token refreshed successfully.",
        "access_token": access_token,
        "token": access_token
    }), 200


@provider_bp.route("/api/provider/logout", methods=["POST"])
def provider_logout():
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


@provider_bp.route("/api/provider/profile", methods=["GET"])
@token_required
def get_provider_profile():
    # g.current_user is populated by token_required decorator
    user_payload = g.current_user
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT 
        u.user_id, u.full_name, u.email, u.phone, u.address, u.city, u.pincode, u.created_at,
        sp.provider_id, sp.business_name, sp.category_id, sp.location_id, sp.experience,
        sp.description, sp.price_per_hour, sp.availability, sp.profile_image, sp.rating
    FROM users u
    INNER JOIN service_providers sp ON u.user_id = sp.user_id
    WHERE u.user_id = %s
    """
    cursor.execute(query, (user_payload["user_id"],))
    provider_details = cursor.fetchone()
    cursor.close()
    conn.close()

    if not provider_details:
        return jsonify({
            "status": False,
            "message": "Service provider details not found."
        }), 404

    # Convert types for JSON compatibility
    if provider_details.get("created_at"):
        provider_details["created_at"] = provider_details["created_at"].isoformat()
    if provider_details.get("price_per_hour"):
        provider_details["price_per_hour"] = float(provider_details["price_per_hour"])
    if provider_details.get("rating"):
        provider_details["rating"] = float(provider_details["rating"])

    return jsonify({
        "status": True,
        "message": "Provider profile fetched successfully.",
        "provider": provider_details
    }), 200