import os
import datetime
import secrets
import jwt
from functools import wraps
from django.http import JsonResponse
from dotenv import load_dotenv
from database.db import get_connection

load_dotenv()

# Configuration variables
JWT_SECRET = os.environ.get("JWT_SECRET", "super_secure_local_service_jwt_secret_key_123!")
try:
    JWT_ACCESS_EXPIRE_MINUTES = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", 15))
except ValueError:
    JWT_ACCESS_EXPIRE_MINUTES = 15

try:
    JWT_REFRESH_EXPIRE_DAYS = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", 7))
except ValueError:
    JWT_REFRESH_EXPIRE_DAYS = 7

def generate_access_token(user_id, email, role, provider_id=None):
    """
    Generates a short-lived JWT Access Token.
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_ACCESS_EXPIRE_MINUTES)
    }
    if provider_id is not None:
        payload["provider_id"] = provider_id
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def generate_and_save_refresh_token(user_id, role):
    """
    Generates a secure cryptographically random Refresh Token and saves it to the database.
    """
    token = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=JWT_REFRESH_EXPIRE_DAYS)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Clean up expired refresh tokens first
        cursor.execute(
            "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
        )
        
        # Save the new refresh token
        normalized_role = role.lower()
        if "admin" in normalized_role:
            query = "INSERT INTO refresh_tokens (admin_id, refresh_token, expires_at) VALUES (%s, %s, %s)"
        elif "provider" in normalized_role:
            query = "INSERT INTO refresh_tokens (provider_id, refresh_token, expires_at) VALUES (%s, %s, %s)"
        else:
            query = "INSERT INTO refresh_tokens (customer_id, refresh_token, expires_at) VALUES (%s, %s, %s)"
            
        cursor.execute(query, (user_id, token, expires_at))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
    
    return token

def token_required(f):
    """
    Decorator/Middleware to protect Django endpoints by requiring a valid JWT access token.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        request = None
        if args:
            request = args[0]
        elif "request" in kwargs:
            request = kwargs["request"]

        token = None
        if request and hasattr(request, "headers"):
            auth_header = request.headers.get("Authorization")
            if not auth_header and hasattr(request, "META"):
                auth_header = request.META.get("HTTP_AUTHORIZATION")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return JsonResponse({
                "status": False,
                "message": "Token is missing."
            }, status=401)
            
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if request:
                request.current_user = payload
        except jwt.ExpiredSignatureError:
            return JsonResponse({
                "status": False,
                "message": "Token has expired."
            }, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({
                "status": False,
                "message": "Invalid token."
            }, status=401)
            
        return f(*args, **kwargs)
    return decorated
