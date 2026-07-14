from flask import Blueprint, request, jsonify, g
from database.db import get_connection
import bcrypt
import datetime
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)

admin_bp = Blueprint("admin", __name__)

def admin_required(f):
    """ Helper decorator to check if user role is Admin or Super Admin. """
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user') or not g.current_user:
            return jsonify({"status": False, "message": "Unauthorized."}), 401
        role = g.current_user.get("role", "").lower()
        if "admin" not in role:
            return jsonify({"status": False, "message": "Forbidden. Admin access required."}), 403
        return f(*args, **kwargs)
    return decorated_function

# ====================================================
# ADMIN LOGIN
# ====================================================

@admin_bp.route("/api/admin/login", methods=["POST"])
def login_admin():
    try:
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"status": False, "message": "Email and Password are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM admins WHERE email = %s", (email,))
        admin = cursor.fetchone()

        if not admin:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}), 401

        if admin["status"] == "Inactive":
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Admin account is inactive."}), 403

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), admin["password_hash"].encode("utf-8")):
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}), 401

        # Generate tokens
        access_token = generate_access_token(admin["admin_id"], admin["email"], admin["role"])
        refresh_token = generate_and_save_refresh_token(admin["admin_id"], admin["role"])

        # Update last login
        cursor.execute("UPDATE admins SET last_login = NOW() WHERE admin_id = %s", (admin["admin_id"],))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Admin login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token": access_token,
            "admin": {
                "admin_id": admin["admin_id"],
                "full_name": admin["full_name"],
                "email": admin["email"],
                "role": admin["role"]
            }
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# PROVIDER APPROVAL & SUSPENSION
# ====================================================

@admin_bp.route("/api/admin/provider/<int:provider_id>/approve", methods=["POST"])
@token_required
@admin_required
def approve_provider(provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}), 404

        cursor.execute("UPDATE providers SET status = 'Approved' WHERE provider_id = %s", (provider_id,))
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Approved', 'Your service provider registration has been approved by admin.', 0)",
            (provider_id,)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider approved successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/provider/<int:provider_id>/reject", methods=["POST"])
@token_required
@admin_required
def reject_provider(provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}), 404

        cursor.execute("UPDATE providers SET status = 'Rejected' WHERE provider_id = %s", (provider_id,))
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Rejected', 'Your registration was rejected. Contact support.', 0)",
            (provider_id,)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider rejected successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/provider/<int:provider_id>/suspend", methods=["POST"])
@token_required
@admin_required
def suspend_provider(provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}), 404

        cursor.execute("UPDATE providers SET status = 'Suspended' WHERE provider_id = %s", (provider_id,))
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Suspended', 'Your provider account has been suspended by admin.', 0)",
            (provider_id,)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider suspended successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# CUSTOMER SUSPENSION
# ====================================================

@admin_bp.route("/api/admin/customer/<int:customer_id>/suspend", methods=["POST"])
@token_required
@admin_required
def suspend_customer(customer_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}), 404

        cursor.execute("UPDATE customers SET status = 'Blocked' WHERE customer_id = %s", (customer_id,))
        conn.commit()

        # Notify Customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'System', 'Account Suspended', 'Your account has been blocked by admin.', 0)",
            (customer_id,)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Customer suspended successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# DASHBOARD STATS, REPORTS & ACTIVITY LOGS
# ====================================================

@admin_bp.route("/api/admin/stats", methods=["GET"])
@admin_bp.route("/api/admin/dashboard", methods=["GET"])
@token_required
@admin_required
def get_dashboard_stats():

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as count FROM customers")
        total_customers = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM providers")
        total_providers = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM bookings")
        total_bookings = cursor.fetchone()["count"]

        cursor.execute("SELECT SUM(final_price) as sum FROM bookings WHERE payment_status = 'Paid'")
        total_revenue = cursor.fetchone()["sum"]
        total_revenue = float(total_revenue) if total_revenue else 0.0

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "stats": {
                "total_customers": total_customers,
                "total_providers": total_providers,
                "total_bookings": total_bookings,
                "total_revenue": total_revenue
            }
        }), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/reports", methods=["GET"])
@token_required
@admin_required
def get_aggregate_reports():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Booking status counts
        cursor.execute("SELECT booking_status, COUNT(*) as count FROM bookings GROUP BY booking_status")
        booking_status_summary = cursor.fetchall()

        # Category popularities
        query_categories = """
        SELECT c.category_name, COUNT(b.booking_id) as booking_count
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN categories c ON s.category_id = c.category_id
        GROUP BY c.category_name
        ORDER BY booking_count DESC
        """
        cursor.execute(query_categories)
        category_popularity = cursor.fetchall()

        # Monthly billing stats
        query_monthly = """
        SELECT DATE_FORMAT(created_at, '%%Y-%%m') as month, SUM(final_price) as revenue, COUNT(*) as booking_count
        FROM bookings
        WHERE payment_status = 'Paid'
        GROUP BY month
        ORDER BY month DESC
        """
        cursor.execute(query_monthly)
        monthly_revenue = cursor.fetchall()

        for m in monthly_revenue:
            if m.get("revenue"):
                m["revenue"] = float(m["revenue"])

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "reports": {
                "booking_status_summary": booking_status_summary,
                "category_popularity": category_popularity,
                "monthly_revenue": monthly_revenue
            }
        }), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/activity-logs", methods=["GET"])
@token_required
@admin_required
def get_activity_logs():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT bh.*, b.booking_number
        FROM booking_history bh
        JOIN bookings b ON bh.booking_id = b.booking_id
        ORDER BY bh.changed_at DESC
        """
        cursor.execute(query)
        logs = cursor.fetchall()
        cursor.close()
        conn.close()

        for l in logs:
            if l.get("changed_at"):
                l["changed_at"] = l["changed_at"].isoformat()

        return jsonify({"status": True, "activity_logs": logs}), 200
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# CATEGORY CRUD
# ====================================================

@admin_bp.route("/api/category", methods=["POST"])
@token_required
@admin_required
def create_category():
    try:
        data = request.get_json() or {}
        category_name = data.get("category_name")
        category_icon = data.get("category_icon")
        description = data.get("description")

        if not category_name:
            return jsonify({"status": False, "message": "Category Name is required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("INSERT INTO categories (category_name, category_icon, description, status) VALUES (%s, %s, %s, 'Active')", (category_name, category_icon, description))
        cat_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Category created successfully.",
            "category": {
                "category_id": cat_id,
                "category_name": category_name,
                "category_icon": category_icon,
                "description": description,
                "status": "Active"
            }
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/category/<int:category_id>", methods=["PUT"])
@token_required
@admin_required
def update_category(category_id):
    try:
        data = request.get_json() or {}
        category_name = data.get("category_name")
        category_icon = data.get("category_icon")
        description = data.get("description")
        status = data.get("status")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM categories WHERE category_id = %s", (category_id,))
        category = cursor.fetchone()

        if not category:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Category not found."}), 404

        name = category_name if category_name is not None else category["category_name"]
        icon = category_icon if category_icon is not None else category["category_icon"]
        desc = description if description is not None else category["description"]
        stat = status if status is not None else category["status"]

        cursor.execute(
            "UPDATE categories SET category_name = %s, category_icon = %s, description = %s, status = %s WHERE category_id = %s",
            (name, icon, desc, stat, category_id)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Category updated successfully."
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/category/<int:category_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_category(category_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM categories WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Category not found."}), 404

        # Set status to Inactive instead of physical delete to preserve constraints
        cursor.execute("UPDATE categories SET status = 'Inactive' WHERE category_id = %s", (category_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Category deactivated successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# SERVICE CRUD
# ====================================================

@admin_bp.route("/api/service", methods=["POST"])
@token_required
@admin_required
def create_service():
    try:
        data = request.get_json() or {}
        category_id = data.get("category_id")
        service_name = data.get("service_name")
        description = data.get("description")
        estimated_price = data.get("estimated_price")
        estimated_duration = data.get("estimated_duration")

        if not category_id or not service_name:
            return jsonify({"status": False, "message": "Category ID and Service Name are required."}), 400

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check category
        cursor.execute("SELECT category_id FROM categories WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Category not found."}), 404

        cursor.execute(
            "INSERT INTO services (category_id, service_name, description, estimated_price, estimated_duration, status) VALUES (%s, %s, %s, %s, %s, 'Active')",
            (category_id, service_name, description, estimated_price, estimated_duration)
        )
        srv_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Service created successfully.",
            "service": {
                "service_id": srv_id,
                "category_id": category_id,
                "service_name": service_name,
                "description": description,
                "estimated_price": float(estimated_price) if estimated_price else None,
                "estimated_duration": estimated_duration,
                "status": "Active"
            }
        }), 201

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/service/<int:service_id>", methods=["PUT"])
@token_required
@admin_required
def update_service(service_id):
    try:
        data = request.get_json() or {}
        category_id = data.get("category_id")
        service_name = data.get("service_name")
        description = data.get("description")
        estimated_price = data.get("estimated_price")
        estimated_duration = data.get("estimated_duration")
        status = data.get("status")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM services WHERE service_id = %s", (service_id,))
        service = cursor.fetchone()

        if not service:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Service not found."}), 404

        cat_id = category_id if category_id is not None else service["category_id"]
        name = service_name if service_name is not None else service["service_name"]
        desc = description if description is not None else service["description"]
        price = estimated_price if estimated_price is not None else service["estimated_price"]
        duration = estimated_duration if estimated_duration is not None else service["estimated_duration"]
        stat = status if status is not None else service["status"]

        cursor.execute(
            "UPDATE services SET category_id = %s, service_name = %s, description = %s, estimated_price = %s, estimated_duration = %s, status = %s WHERE service_id = %s",
            (cat_id, name, desc, price, duration, stat, service_id)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "message": "Service updated successfully."
        }), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/service/<int:service_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_service(service_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM services WHERE service_id = %s", (service_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Service not found."}), 404

        # Set status to Inactive instead of physical delete
        cursor.execute("UPDATE services SET status = 'Inactive' WHERE service_id = %s", (service_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Service deactivated successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# REFUND PAYMENT
# ====================================================

@admin_bp.route("/api/payment/<int:booking_id>/refund", methods=["POST"])
@token_required
@admin_required
def refund_payment(booking_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}), 404

        if booking["payment_status"] != 'Paid':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Refund can only be issued for Paid bookings."}), 400

        old_status = booking["booking_status"]

        # Update Booking set payment_status = 'Refunded' and booking_status = 'Cancelled'
        cursor.execute(
            "UPDATE bookings SET payment_status = 'Refunded', booking_status = 'Cancelled', cancelled_by = 'Admin', cancelled_at = NOW() WHERE booking_id = %s",
            (booking_id,)
        )
        # Update History
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, %s, 'Cancelled', 'Payment refunded by admin', 'Admin')",
            (booking_id, old_status)
        )
        # Notify Customer and Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Payment', 'Payment Refunded', %s, 0)",
            (booking["customer_id"], f"Your payment of {booking['booking_number']} has been refunded by admin.")
        )
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Payment', 'Booking Refunded', %s, 0)",
            (booking["provider_id"], f"Payment of booking {booking['booking_number']} has been refunded and cancelled by admin.")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Payment refunded successfully."}), 200

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


# ====================================================
# ADMIN LIST ENDPOINTS
# ====================================================

@admin_bp.route("/api/admin/providers", methods=["GET"])
@token_required
@admin_required
def admin_list_providers():
    try:
        status_filter = request.args.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT provider_id, business_name, owner_name, email, phone, category_id,
               address, city, state, pincode, experience_years, description,
               average_rating, total_reviews, status, email_verified, last_login, created_at
        FROM providers
        WHERE deleted_at IS NULL
        """
        params = []
        if status_filter:
            query += " AND status = %s"
            params.append(status_filter)
        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        providers = cursor.fetchall()
        cursor.close()
        conn.close()

        for p in providers:
            if p.get("average_rating"):
                p["average_rating"] = float(p["average_rating"])
            if p.get("created_at"):
                p["created_at"] = p["created_at"].isoformat()
            if p.get("last_login"):
                p["last_login"] = p["last_login"].isoformat()

        return jsonify({"status": True, "providers": providers, "total": len(providers)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/customers", methods=["GET"])
@token_required
@admin_required
def admin_list_customers():
    try:
        status_filter = request.args.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT customer_id, full_name, email, phone, gender, address, city, state, pincode,
               status, email_verified, last_login, created_at
        FROM customers
        WHERE deleted_at IS NULL
        """
        params = []
        if status_filter:
            query += " AND status = %s"
            params.append(status_filter)
        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        customers = cursor.fetchall()
        cursor.close()
        conn.close()

        for c in customers:
            if c.get("created_at"):
                c["created_at"] = c["created_at"].isoformat()
            if c.get("last_login"):
                c["last_login"] = c["last_login"].isoformat()
            if c.get("date_of_birth"):
                c["date_of_birth"] = c["date_of_birth"].isoformat() if hasattr(c["date_of_birth"], "isoformat") else str(c["date_of_birth"])

        return jsonify({"status": True, "customers": customers, "total": len(customers)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/categories", methods=["GET"])
@token_required
@admin_required
def admin_list_categories():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categories ORDER BY category_name ASC")
        categories = cursor.fetchall()
        cursor.close()
        conn.close()

        for c in categories:
            if c.get("created_at"):
                c["created_at"] = c["created_at"].isoformat()

        return jsonify({"status": True, "categories": categories, "total": len(categories)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/services", methods=["GET"])
@token_required
@admin_required
def admin_list_services():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, c.category_name
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.category_id
            ORDER BY s.service_name ASC
        """)
        services = cursor.fetchall()
        cursor.close()
        conn.close()

        for s in services:
            if s.get("created_at"):
                s["created_at"] = s["created_at"].isoformat()
            if s.get("base_price"):
                s["base_price"] = float(s["base_price"])

        return jsonify({"status": True, "services": services, "total": len(services)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/bookings", methods=["GET"])
@token_required
@admin_required
def admin_list_bookings():
    try:
        status_filter = request.args.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT b.*,
               s.service_name,
               c.full_name AS customer_name, c.email AS customer_email,
               p.business_name AS provider_name, p.email AS provider_email
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN providers p ON b.provider_id = p.provider_id
        """
        params = []
        if status_filter:
            query += " WHERE b.booking_status = %s"
            params.append(status_filter)
        query += " ORDER BY b.created_at DESC"

        cursor.execute(query, tuple(params))
        bookings = cursor.fetchall()
        cursor.close()
        conn.close()

        for b in bookings:
            for key in ["booking_date", "created_at", "updated_at", "accepted_at", "started_at", "completed_at", "cancelled_at"]:
                if b.get(key) and hasattr(b[key], "isoformat"):
                    b[key] = b[key].isoformat()
            if b.get("booking_time"):
                b["booking_time"] = str(b["booking_time"])
            for key in ["estimated_price", "final_price"]:
                if b.get(key):
                    b[key] = float(b[key])

        return jsonify({"status": True, "bookings": bookings, "total": len(bookings)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500


@admin_bp.route("/api/admin/reviews", methods=["GET"])
@token_required
@admin_required
def admin_list_reviews():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*,
                   c.full_name AS customer_name,
                   p.business_name AS provider_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN providers p ON r.provider_id = p.provider_id
            ORDER BY r.created_at DESC
        """)
        reviews = cursor.fetchall()
        cursor.close()
        conn.close()

        for r in reviews:
            for key in ["created_at", "updated_at", "reply_date"]:
                if r.get(key) and hasattr(r[key], "isoformat"):
                    r[key] = r[key].isoformat()

        return jsonify({"status": True, "reviews": reviews, "total": len(reviews)}), 200

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}), 500






