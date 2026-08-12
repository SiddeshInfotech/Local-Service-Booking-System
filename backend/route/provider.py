from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from utils.compat import jsonify, get_json_data, get_current_user, secure_filename
from database.db import get_connection
import bcrypt
import datetime
import os
import secrets
import cloudinary
import cloudinary.uploader
import cloudinary_config
from utils.email import send_email, send_email_detailed, send_email_async, get_otp_email_template
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)


# Config for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
ALLOWED_ID_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_ID_FILE_SIZE = 5 * 1024 * 1024  # 5 MB limit

def allowed_file(request, filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_and_upload_id_proof(file, folder="provider-id-proofs"):
    """Validate and upload an ID proof image to Cloudinary.
    
    Works with Django's InMemoryUploadedFile (from request.FILES).
    Uses .name and .size instead of Flask-style .filename / .seek().
    """
    if not file:
        return False, "No file uploaded or selected.", None

    # Django InMemoryUploadedFile uses .name, not .filename
    file_name = getattr(file, 'name', '') or ''
    if not file_name:
        return False, "No file selected.", None

    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if ext not in ALLOWED_ID_IMAGE_EXTENSIONS:
        return False, f"Invalid file format '.{ext}'. Only JPG, JPEG, PNG, and WEBP image files are allowed.", None

    # Django InMemoryUploadedFile exposes .size directly
    file_size = getattr(file, 'size', None)
    if file_size is None:
        # Fallback: seek to end
        try:
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
        except Exception:
            file_size = 0

    if file_size > MAX_ID_FILE_SIZE:
        return False, "File size exceeds maximum limit of 5 MB.", None

    try:
        upload_result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="image"
        )
        url = upload_result.get("secure_url") or upload_result.get("url")
        if not url:
            return False, "Failed to obtain URL from Cloudinary upload.", None
        return True, None, url
    except Exception as upload_err:
        return False, f"Cloudinary upload error: {str(upload_err)}", None

# ====================================================
# PROVIDER AUTHENTICATION
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_provider(request):
    try:
        # request.data works for both JSON and multipart/form-data in DRF.
        # get_json_data() only works for JSON, so for file uploads (multipart) we must use request.data.
        data = request.data
        email = data.get("email")



        password = data.get("password")
        phone = data.get("phone")
        address = data.get("address")
        city = data.get("city")
        state = data.get("state")
        pincode = data.get("pincode")
        description = data.get("description", "")

        # Support both 'experience_years' and 'experience' from frontend
        experience_years = data.get("experience_years") or data.get("experience", 0)
        try:
            experience_years = int(experience_years) if experience_years else 0
        except (ValueError, TypeError):
            experience_years = 0

        # Accept full_name with aliases for backward compatibility
        full_name = (
            data.get("full_name")
            or data.get("owner_name")
            or data.get("business_name")
        )

        # Map 'service' (string category name) or 'category_id' (direct ID)
        # Frontend sends service as a string like "Electrician"
        service_name = (
            data.get("service")
            or data.get("service_name")
            or data.get("category_name")
        )
        category_id_direct = data.get("category_id")

        if not full_name or not email or not password:
            return jsonify({
                "status": False,
                "message": "Full Name, Email and Password are required."
            }, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check duplicate email
        cursor.execute("SELECT provider_id FROM providers WHERE email=%s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Email already exists."}, status=409)

        # Check duplicate phone
        if phone:
            cursor.execute("SELECT provider_id FROM providers WHERE phone=%s", (phone,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": "Phone number already registered."}, status=400)

        # Resolve category_id: prefer direct ID, else look up by name
        category_id = None
        if category_id_direct:
            try:
                category_id = int(category_id_direct)
            except (ValueError, TypeError):
                category_id = None
        elif service_name:
            cursor.execute(
                "SELECT category_id FROM categories WHERE category_name = %s AND status = 'Active' LIMIT 1",
                (service_name,)
            )
            cat_row = cursor.fetchone()
            if cat_row:
                category_id = cat_row["category_id"]
            else:
                # Fallback: case-insensitive partial match
                cursor.execute(
                    "SELECT category_id FROM categories WHERE category_name LIKE %s AND status = 'Active' LIMIT 1",
                    (f"%{service_name}%",)
                )
                cat_row = cursor.fetchone()
                if cat_row:
                    category_id = cat_row["category_id"]

        # Hash Password
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # example.com accounts get auto-approved for testing
        if email.endswith("@example.com"):
            status = "Approved"
        else:
            status = "Pending"
        email_verified = 1

        owner_name = data.get("owner_name") or full_name
        business_name = data.get("business_name") or full_name

        query = """
        INSERT INTO providers
        (
            business_name,
            owner_name,
            email,
            password_hash,
            phone,
            address,
            city,
            state,
            pincode,
            experience_years,
            description,
            category_id,
            status,
            email_verified
        )
        VALUES
        (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """
        # Check if ID proof file is attached in request.FILES during registration
        id_proof_file = (
            request.FILES.get("id_proof")
            or request.FILES.get("document_file")
            or request.FILES.get("idProof")
        )
        id_proof_url = None
        # Django's InMemoryUploadedFile uses .name (not .filename)
        if id_proof_file and getattr(id_proof_file, 'name', ''):
            success, err_msg, id_proof_url = validate_and_upload_id_proof(id_proof_file, folder="provider-id-proofs")
            if not success:
                cursor.close()
                conn.close()
                return jsonify({"status": False, "message": err_msg}, status=400)

        cursor.execute(query, (
            business_name,
            owner_name,
            email,
            password_hash,
            phone,
            address,
            city,
            state,
            pincode,
            experience_years,
            description,
            category_id,
            status,
            email_verified
        ))
        provider_id = cursor.lastrowid

        if id_proof_url:
            cursor.execute(
                "INSERT INTO provider_documents (provider_id, document_type, file_path, verification_status) VALUES (%s, 'ID Proof', %s, 'Pending')",
                (provider_id, id_proof_url)
            )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Provider registered successfully."
        }, status=201)


    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def verify_provider_email(request):
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
        # Verify provider
        cursor.execute(
            "UPDATE providers SET email_verified = 1 WHERE email = %s",
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
def login_provider(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({
                "status": False,
                "message": "Email and Password are required."
            }, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check provider exists
        cursor.execute("SELECT * FROM providers WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Provider not found."
            }, status=404)

        # Verify password
        if not bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8")
        ):
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Invalid email or password."
            }, status=401)

        # Email verification check
        if not user["email_verified"]:
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Please verify your email before logging in."
            }, status=403)

        # Provider status checks
        if user["status"] == "Pending":
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Your account is awaiting admin approval."
            }, status=403)

        if user["status"] == "Rejected":
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Your registration has been rejected by the admin."
            }, status=403)

        # Block both 'Blocked' and legacy 'Suspended' statuses
        if user["status"] in ("Blocked", "Suspended"):
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": "Your account has been blocked by the admin. Please contact support."
            }, status=403)

        # Generate JWT tokens
        access_token = generate_access_token(
            user["provider_id"],
            user["email"],
            "provider",
            provider_id=user["provider_id"]
        )

        refresh_token = generate_and_save_refresh_token(
            user["provider_id"],
            "provider"
        )

        # Update last login
        cursor.execute(
            "UPDATE providers SET last_login = NOW() WHERE provider_id = %s",
            (user["provider_id"],)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "provider": {
                "provider_id": user["provider_id"],
                "full_name": user.get("business_name") or user.get("owner_name") or "",
                "business_name": user.get("business_name") or "",
                "owner_name": user.get("owner_name") or "",
                "email": user["email"],
                "phone": user["phone"],
                "profile_image": user.get("profile_image"),
                "address": user.get("address"),
                "city": user.get("city"),
                "state": user.get("state"),
                "pincode": user.get("pincode"),
                "experience_years": user.get("experience_years"),
                "description": user.get("description"),
                "average_rating": float(user["average_rating"]) if user.get("average_rating") else 0.0,
                "total_reviews": user.get("total_reviews", 0),
                "status": user["status"]
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
def provider_forgot_password(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        if not email:
            return jsonify({"status": False, "message": "Email is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id, business_name, owner_name FROM providers WHERE email = %s", (email,))
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
        provider_name = user.get('business_name') or user.get('owner_name') or 'Provider'
        email_body = get_otp_email_template(provider_name, otp_code)

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
def provider_verify_otp(request):
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
def provider_reset_password(request):
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

        # Update provider password
        cursor.execute(
            "UPDATE providers SET password_hash = %s WHERE email = %s",
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
def provider_refresh_token(request):
    try:
        data = get_json_data(request)
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return jsonify({"status": False, "message": "Refresh token is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT provider_id, expires_at, revoked FROM refresh_tokens WHERE refresh_token = %s AND provider_id IS NOT NULL",
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

        # Fetch provider details
        cursor.execute("SELECT email FROM providers WHERE provider_id = %s", (token_record["provider_id"],))
        provider = cursor.fetchone()

        cursor.close()
        conn.close()

        if not provider:
            return jsonify({"status": False, "message": "Provider associated with token not found."}, status=401)

        access_token = generate_access_token(token_record["provider_id"], provider["email"], "provider", provider_id=token_record["provider_id"])

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
def provider_logout(request):
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
# PROVIDER PROFILE
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def get_provider_profile(request):
    try:
        user_payload = get_current_user(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT provider_id, business_name, owner_name, email, phone, profile_image, address, city, state, pincode, experience_years, description, average_rating, total_reviews, status, email_verified, created_at FROM providers WHERE provider_id = %s",
            (user_payload["user_id"],)
        )
        provider = cursor.fetchone()

        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Add full_name alias for frontend compatibility
        provider["full_name"] = provider.get("business_name") or provider.get("owner_name") or ""

        # Fetch provider documents
        cursor.execute(
            "SELECT document_id, document_type, file_path, verification_status, uploaded_at FROM provider_documents WHERE provider_id = %s",
            (user_payload["user_id"],)
        )
        documents = cursor.fetchall()
        cursor.close()
        conn.close()

        for doc in documents:
            if doc.get("uploaded_at"):
                doc["uploaded_at"] = doc["uploaded_at"].isoformat()

        provider["documents"] = documents

        if provider.get("created_at"):
            provider["created_at"] = provider["created_at"].isoformat()
        if provider.get("average_rating") is not None:
            provider["average_rating"] = float(provider["average_rating"])

        return jsonify({
            "status": True,
            "message": "Profile fetched successfully.",
            "provider": provider
        }, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
def update_provider_profile(request):
    try:
        user_payload = get_current_user(request)
        data = get_json_data(request)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Get existing details
        cursor.execute("SELECT * FROM providers WHERE provider_id = %s", (user_payload["user_id"],))
        provider = cursor.fetchone()

        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Accept full_name or its aliases from frontend
        existing_name = provider.get("business_name") or provider.get("owner_name") or ""
        new_name = (
            data.get("full_name")
            or data.get("owner_name")
            or data.get("business_name")
            or existing_name
        )
        phone = data.get("phone", provider["phone"])
        address = data.get("address", provider["address"])
        city = data.get("city", provider["city"])
        state = data.get("state", provider["state"])
        pincode = data.get("pincode", provider["pincode"])
        experience_years = data.get("experience_years", provider["experience_years"])
        description = data.get("description", provider["description"])
        profile_image = data.get("profile_image", provider["profile_image"])

        query = """
        UPDATE providers
        SET business_name = %s, owner_name = %s, phone = %s, address = %s,
            city = %s, state = %s, pincode = %s, experience_years = %s, description = %s, profile_image = %s
        WHERE provider_id = %s
        """
        cursor.execute(query, (new_name, new_name, phone, address, city, state, pincode, experience_years, description, profile_image, user_payload["user_id"]))
        conn.commit()

        # Fetch updated provider
        cursor.execute("SELECT * FROM providers WHERE provider_id = %s", (user_payload["user_id"],))
        updated_provider = cursor.fetchone()

        cursor.close()
        conn.close()

        # Add full_name alias for frontend compatibility
        updated_provider["full_name"] = updated_provider.get("business_name") or updated_provider.get("owner_name") or ""

        if updated_provider.get("created_at"):
            updated_provider["created_at"] = updated_provider["created_at"].isoformat()
        if updated_provider.get("updated_at"):
            updated_provider["updated_at"] = updated_provider["updated_at"].isoformat()
        if updated_provider.get("average_rating") is not None:
            updated_provider["average_rating"] = float(updated_provider["average_rating"])

        return jsonify({
            "status": True,
            "message": "Profile updated successfully.",
            "provider": updated_provider
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def upload_document(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Only providers can upload documents."}, status=403)

        if "document_file" not in request.FILES:
            return jsonify({"status": False, "message": "No file part in request."}, status=400)

        file = request.FILES["document_file"]
        document_type = request.POST.get("document_type")

        if not getattr(file, 'name', ''):
            return jsonify({"status": False, "message": "No file selected."}, status=400)

        if not document_type or document_type not in ['Aadhaar', 'PAN', 'License', 'Profile Photo', 'Certificate', 'ID Proof']:
            return jsonify({"status": False, "message": "Invalid or missing document type."}, status=400)

        success, err_msg, cloudinary_url = validate_and_upload_id_proof(file, folder="provider-id-proofs")
        if not success:
            return jsonify({"status": False, "message": err_msg}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "INSERT INTO provider_documents (provider_id, document_type, file_path, verification_status) VALUES (%s, %s, %s, 'Pending')",
            (user_payload["user_id"], document_type, cloudinary_url)
        )
        doc_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Document uploaded successfully.",
            "document": {
                "document_id": doc_id,
                "document_type": document_type,
                "file_path": cloudinary_url,
                "verification_status": "Pending"
            }
        }, status=201)


    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# PROVIDER SERVICES MAPPING
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def link_service(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        service_id = data.get("service_id")
        experience_years = data.get("experience_years", 0)
        service_charge = data.get("service_charge")

        if not service_id or service_charge is None:
            return jsonify({"status": False, "message": "Service ID and Service Charge are required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if service exists
        cursor.execute("SELECT service_id FROM services WHERE service_id = %s", (service_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Service not found."}, status=404)

        # Link/Update service mapping
        cursor.execute(
            "SELECT provider_service_id FROM provider_services WHERE provider_id = %s AND service_id = %s",
            (user_payload["user_id"], service_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                "UPDATE provider_services SET experience_years = %s, service_charge = %s, is_available = 1 WHERE provider_service_id = %s",
                (experience_years, service_charge, existing["provider_service_id"])
            )
        else:
            cursor.execute(
                "INSERT INTO provider_services (provider_id, service_id, experience_years, service_charge, is_available) VALUES (%s, %s, %s, %s, 1)",
                (user_payload["user_id"], service_id, experience_years, service_charge)
            )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Service linked successfully."}, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def list_linked_services(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT ps.provider_service_id, ps.service_id, ps.experience_years, ps.service_charge, ps.is_available, s.service_name, s.description
        FROM provider_services ps
        JOIN services s ON ps.service_id = s.service_id
        WHERE ps.provider_id = %s
        """
        cursor.execute(query, (user_payload["user_id"],))
        services = cursor.fetchall()
        cursor.close()
        conn.close()

        for s in services:
            if s.get("service_charge"):
                s["service_charge"] = float(s["service_charge"])

        return jsonify({"status": True, "services": services}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
def unlink_service(request, service_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "DELETE FROM provider_services WHERE provider_id = %s AND service_id = %s",
            (user_payload["user_id"], service_id)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": True, "message": "Service unlinked successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# BOOKINGS (PROVIDER OPS)
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
def get_provider_booking_history(request):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT b.*, s.service_name, c.full_name as customer_name
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN customers c ON b.customer_id = c.customer_id
        WHERE b.provider_id = %s
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
def accept_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND provider_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] != 'Pending':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking request cannot be accepted in its current state."}, status=400)

        # Update Booking
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Accepted', accepted_at = NOW() WHERE booking_id = %s",
            (booking_id,)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, 'Pending', 'Accepted', 'Booking request accepted by provider', 'Provider')",
            (booking_id,)
        )
        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Booking Accepted', %s, 0)",
            (booking["customer_id"], f"Your booking {booking['booking_number']} has been accepted by the provider.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking request accepted successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def reject_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND provider_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] != 'Pending':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking request cannot be rejected."}, status=400)

        # Update Booking
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Rejected' WHERE booking_id = %s",
            (booking_id,)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, 'Pending', 'Rejected', 'Booking request rejected by provider', 'Provider')",
            (booking_id,)
        )
        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Booking Rejected', %s, 0)",
            (booking["customer_id"], f"Your booking {booking['booking_number']} has been rejected by the provider.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking request rejected successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def start_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND provider_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] != 'Accepted':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking cannot be started."}, status=400)

        # Update Booking
        cursor.execute(
            "UPDATE bookings SET booking_status = 'In Progress', started_at = NOW() WHERE booking_id = %s",
            (booking_id,)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, 'Accepted', 'In Progress', 'Job started by provider', 'Provider')",
            (booking_id,)
        )
        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Job Started', %s, 0)",
            (booking["customer_id"], f"The provider has started work on your booking {booking['booking_number']}.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking work started successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def complete_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        final_price = data.get("final_price")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND provider_id = %s", (booking_id, user_payload["user_id"]))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] != 'In Progress':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking cannot be marked complete."}, status=400)

        # Determine price
        price = final_price if final_price is not None else booking["estimated_price"]

        # Update Booking
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Finished', final_price = %s, completed_at = NOW(), completed_by = 'provider' WHERE booking_id = %s",
            (price, booking_id)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, 'In Progress', 'Finished', 'Job marked as Finished by provider', 'Provider')",
            (booking_id,)
        )
        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Job Finished', %s, 0)",
            (booking["customer_id"], f"The provider has finished work on your booking {booking['booking_number']}. Please confirm completion.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking marked as finished successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def provider_cancel_booking(request, booking_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        reason = data.get("reason", "Cancelled by provider")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND provider_id = %s", (booking_id, user_payload["user_id"]))
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
            "UPDATE bookings SET booking_status = 'Cancelled', cancellation_reason = %s, cancelled_by = 'Provider', cancelled_at = NOW() WHERE booking_id = %s",
            (reason, booking_id)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, %s, 'Cancelled', %s, 'Provider')",
            (booking_id, old_status, reason)
        )
        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Booking Cancelled', %s, 0)",
            (booking["customer_id"], f"Booking request {booking['booking_number']} has been cancelled by the provider.")
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


# ====================================================
# REVIEWS (PROVIDER OPS)
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
def reply_to_review(request, review_id):
    try:
        user_payload = get_current_user(request)
        if user_payload["role"] != "provider":
            return jsonify({"status": False, "message": "Unauthorized."}, status=403)

        data = get_json_data(request)
        reply_text = data.get("reply_text")

        if not reply_text:
            return jsonify({"status": False, "message": "Reply text is required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM reviews WHERE review_id = %s AND provider_id = %s", (review_id, user_payload["user_id"]))
        review = cursor.fetchone()

        if not review:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Review not found or unauthorized."}, status=404)

        cursor.execute(
            "UPDATE reviews SET provider_reply = %s, reply_date = NOW() WHERE review_id = %s",
            (reply_text, review_id)
        )
        conn.commit()

        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Review', 'Review Replied', %s, 0)",
            (review["customer_id"], "The provider has replied to your review.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Reply submitted successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)