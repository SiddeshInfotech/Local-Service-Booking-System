import os
import datetime
import secrets
import jwt
from functools import wraps
from flask import request, jsonify, g
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

def generate_and_save_refresh_token(user_id):
    """
    Generates a secure cryptographically random Refresh Token and saves it to the database.
    """
    token = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=JWT_REFRESH_EXPIRE_DAYS)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Clean up expired refresh tokens first
    cursor.execute(
        "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
    )
    
    # Save the new refresh token
    cursor.execute(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires_at)
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    return token

def token_required(f):
    """
    Decorator/Middleware to protect endpoints by requiring a valid JWT access token.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
        if not token:
            return jsonify({
                "status": False,
                "message": "Token is missing."
            }), 401
            
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({
                "status": False,
                "message": "Token has expired."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "status": False,
                "message": "Invalid token."
            }), 401
            
        return f(*args, **kwargs)
    return decorated
