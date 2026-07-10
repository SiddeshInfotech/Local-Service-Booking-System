from flask import Blueprint, request, jsonify
from database.db import get_connection
import bcrypt

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/api/admin/login", methods=["POST"])
def login_admin():
    data = request.get_json()

    if not data:
        return jsonify({
            "status": False,
            "message": "Invalid Request."
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "status": False,
            "message": "Invalid Email or Password"
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Find admin using email
    cursor.execute("SELECT * FROM admins WHERE email = %s", (email,))
    admin = cursor.fetchone()

    cursor.close()
    conn.close()

    if not admin:
        return jsonify({
            "status": False,
            "message": "Invalid Email or Password"
        }), 401

    # Compare password
    if not bcrypt.checkpw(
        password.encode("utf-8"),
        admin["password"].encode("utf-8")
    ):
        return jsonify({
            "status": False,
            "message": "Invalid Email or Password"
        }), 401

    return jsonify({
        "status": True,
        "message": "Admin Login Successful",
        "admin": {
            "admin_id": admin["admin_id"],
            "full_name": admin["full_name"],
            "email": admin["email"]
        }
    }), 200
