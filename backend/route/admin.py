from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from utils.compat import jsonify, get_json_data, get_current_user
from database.db import get_connection
import bcrypt
import datetime
from utils.auth_utils import (
    generate_access_token,
    generate_and_save_refresh_token,
    token_required
)


def admin_required(f):
    """ Helper decorator to check if user role is Admin or Super Admin. """
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        request = args[0] if args else kwargs.get('request')
        user = get_current_user(request)
        if not user:
            return jsonify({"status": False, "message": "Unauthorized."}, status=401)
        role = user.get("role", "").lower()
        if "admin" not in role:
            return jsonify({"status": False, "message": "Forbidden. Admin access required."}, status=403)
        return f(*args, **kwargs)
    return decorated_function

# ====================================================
# ADMIN LOGIN
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login_admin(request):
    try:
        data = get_json_data(request)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"status": False, "message": "Email and Password are required."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM admins WHERE email = %s", (email,))
        admin = cursor.fetchone()

        if not admin:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}, status=401)

        if admin["status"] == "Inactive":
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Admin account is inactive."}, status=403)

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), admin["password_hash"].encode("utf-8")):
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Invalid email or password."}, status=401)

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
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# PROVIDER APPROVAL & SUSPENSION
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def approve_provider(request, provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

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
        return jsonify({"status": True, "message": "Provider approved successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def reject_provider(request, provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

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
        return jsonify({"status": True, "message": "Provider rejected successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def suspend_provider(request, provider_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Use 'Suspended' in the database (mapped to 'Blocked' on read/write boundary)
        cursor.execute("UPDATE providers SET status = 'Suspended' WHERE provider_id = %s", (provider_id,))
        conn.commit()

        # Notify Provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Blocked', 'Your provider account has been blocked by admin.', 0)",
            (provider_id,)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider blocked successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# CUSTOMER SUSPENSION
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def suspend_customer(request, customer_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

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
        return jsonify({"status": True, "message": "Customer suspended successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# DASHBOARD STATS, REPORTS & ACTIVITY LOGS
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def get_dashboard_stats(request):

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as count FROM customers")
        total_customers = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM providers")
        total_providers = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM providers WHERE status = 'Pending'")
        pending_providers = cursor.fetchone()["count"]

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
                "pending_providers": pending_providers,
                "total_bookings": total_bookings,
                "total_revenue": total_revenue
            }
        }, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def get_aggregate_reports(request):
    try:
        import datetime as dt

        # Parse optional date range: 7d | 30d | ytd
        date_range = request.GET.get("range", "").strip().lower()
        now = dt.datetime.utcnow()

        if date_range == "7d":
            since = now - dt.timedelta(days=7)
            label = "Last 7 Days"
        elif date_range == "30d":
            since = now - dt.timedelta(days=30)
            label = "Last 30 Days"
        elif date_range == "ytd":
            since = dt.datetime(now.year, 1, 1)
            label = "Year-to-Date"
        else:
            # Default: all time
            since = None
            label = "All Time"

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Build WHERE clause for date range
        date_filter = ""
        date_params_single = []
        if since:
            date_filter = "WHERE b.created_at >= %s"
            date_params_single = [since]

        # Booking status counts
        status_query = f"""
            SELECT booking_status, COUNT(*) as count
            FROM bookings
            {'WHERE created_at >= %s' if since else ''}
            GROUP BY booking_status
        """
        cursor.execute(status_query, [since] if since else [])
        booking_status_summary = cursor.fetchall()

        # Summary counts
        summary_query = f"""
            SELECT
                COUNT(*) as total_bookings,
                SUM(CASE WHEN booking_status = 'Completed' THEN 1 ELSE 0 END) as completed_bookings,
                SUM(CASE WHEN booking_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                SUM(CASE WHEN payment_status = 'Paid' THEN COALESCE(final_price, estimated_price, 0) ELSE 0 END) as total_revenue
            FROM bookings
            {'WHERE created_at >= %s' if since else ''}
        """
        cursor.execute(summary_query, [since] if since else [])
        summary_row = cursor.fetchone() or {}
        for key in ["total_revenue"]:
            if summary_row.get(key):
                summary_row[key] = float(summary_row[key])

        # Active users in period
        cust_query = f"""
            SELECT COUNT(DISTINCT customer_id) as active_customers
            FROM bookings
            {'WHERE created_at >= %s' if since else ''}
        """
        cursor.execute(cust_query, [since] if since else [])
        active_customers = (cursor.fetchone() or {}).get("active_customers", 0)

        prov_query = f"""
            SELECT COUNT(DISTINCT provider_id) as active_providers
            FROM bookings
            {'WHERE created_at >= %s' if since else ''}
        """
        cursor.execute(prov_query, [since] if since else [])
        active_providers = (cursor.fetchone() or {}).get("active_providers", 0)

        # Category popularities
        cat_query = f"""
            SELECT c.category_name, COUNT(b.booking_id) as booking_count,
                   COALESCE(SUM(CASE WHEN b.payment_status='Paid' THEN COALESCE(b.final_price,b.estimated_price,0) ELSE 0 END),0) as revenue
            FROM bookings b
            JOIN services s ON b.service_id = s.service_id
            JOIN categories c ON s.category_id = c.category_id
            {date_filter.replace('b.created_at', 'b.created_at')}
            GROUP BY c.category_name
            ORDER BY booking_count DESC
        """
        cursor.execute(cat_query, date_params_single)
        category_popularity = cursor.fetchall()
        for row in category_popularity:
            if row.get("revenue"):
                row["revenue"] = float(row["revenue"])

        # Monthly revenue breakdown
        monthly_query = f"""
            SELECT DATE_FORMAT(created_at, '%%Y-%%m') as month,
                   SUM(COALESCE(final_price, estimated_price, 0)) as revenue,
                   COUNT(*) as booking_count
            FROM bookings
            WHERE payment_status = 'Paid'
            {'AND created_at >= %s' if since else ''}
            GROUP BY month
            ORDER BY month DESC
            LIMIT 12
        """
        cursor.execute(monthly_query, [since] if since else [])
        monthly_revenue = cursor.fetchall()
        for m in monthly_revenue:
            if m.get("revenue"):
                m["revenue"] = float(m["revenue"])

        # Top performing providers
        top_prov_query = f"""
            SELECT COALESCE(p.business_name, p.owner_name) as provider_name,
                   COUNT(b.booking_id) as total_bookings,
                   p.average_rating,
                   COALESCE(SUM(CASE WHEN b.payment_status='Paid' THEN COALESCE(b.final_price,b.estimated_price,0) ELSE 0 END),0) as revenue
            FROM providers p
            LEFT JOIN bookings b ON p.provider_id = b.provider_id
            {('AND b.created_at >= %s' if since else '').replace('AND', 'WHERE b.provider_id IS NOT NULL AND') if since else ''}
            GROUP BY p.provider_id, p.business_name, p.owner_name, p.average_rating
            ORDER BY total_bookings DESC
            LIMIT 5
        """
        # Simpler top providers query
        if since:
            top_prov_q = """
                SELECT COALESCE(p.business_name, p.owner_name) as provider_name,
                       COUNT(b.booking_id) as total_bookings,
                       COALESCE(p.average_rating, 0) as average_rating,
                       COALESCE(SUM(CASE WHEN b.payment_status='Paid' THEN COALESCE(b.final_price,b.estimated_price,0) ELSE 0 END),0) as revenue
                FROM providers p
                LEFT JOIN bookings b ON p.provider_id = b.provider_id AND b.created_at >= %s
                GROUP BY p.provider_id, p.business_name, p.owner_name, p.average_rating
                ORDER BY total_bookings DESC
                LIMIT 5
            """
            cursor.execute(top_prov_q, [since])
        else:
            top_prov_q = """
                SELECT COALESCE(p.business_name, p.owner_name) as provider_name,
                       COUNT(b.booking_id) as total_bookings,
                       COALESCE(p.average_rating, 0) as average_rating,
                       COALESCE(SUM(CASE WHEN b.payment_status='Paid' THEN COALESCE(b.final_price,b.estimated_price,0) ELSE 0 END),0) as revenue
                FROM providers p
                LEFT JOIN bookings b ON p.provider_id = b.provider_id
                GROUP BY p.provider_id, p.business_name, p.owner_name, p.average_rating
                ORDER BY total_bookings DESC
                LIMIT 5
            """
            cursor.execute(top_prov_q)
        top_providers = cursor.fetchall()
        for tp in top_providers:
            if tp.get("revenue"):
                tp["revenue"] = float(tp["revenue"])
            if tp.get("average_rating") is not None:
                tp["average_rating"] = float(tp["average_rating"])

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "range": label,
            "reports": {
                "booking_status_summary": booking_status_summary,
                "category_popularity": category_popularity,
                "monthly_revenue": monthly_revenue,
                "top_providers": top_providers,
                "summary": {
                    "total_bookings": summary_row.get("total_bookings", 0),
                    "completed_bookings": summary_row.get("completed_bookings", 0),
                    "cancelled_bookings": summary_row.get("cancelled_bookings", 0),
                    "total_revenue": summary_row.get("total_revenue", 0.0),
                    "active_customers": active_customers,
                    "active_providers": active_providers
                }
            }
        }, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def get_activity_logs(request):
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

        return jsonify({"status": True, "activity_logs": logs}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# CATEGORY CRUD
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def create_category(request):
    try:
        data = get_json_data(request)
        category_name = data.get("category_name")
        category_icon = data.get("category_icon")
        description = data.get("description")

        if not category_name:
            return jsonify({"status": False, "message": "Category Name is required."}, status=400)

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
        }, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
@admin_required
def update_category(request, category_id):
    try:
        data = get_json_data(request)
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
            return jsonify({"status": False, "message": "Category not found."}, status=404)

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
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
@admin_required
def delete_category(request, category_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM categories WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Category not found."}, status=404)

        # Set status to Inactive instead of physical delete to preserve constraints
        cursor.execute("UPDATE categories SET status = 'Inactive' WHERE category_id = %s", (category_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Category deactivated successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# SERVICE CRUD
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def create_service(request):
    try:
        data = get_json_data(request)
        category_id = data.get("category_id")
        service_name = data.get("service_name")
        description = data.get("description")
        estimated_price = data.get("estimated_price")
        estimated_duration = data.get("estimated_duration")

        if not category_id or not service_name:
            return jsonify({"status": False, "success": False, "message": "Category ID and Service Name are required."}, status=400)

        if estimated_price is None or str(estimated_price).strip() == "":
            return jsonify({"status": False, "success": False, "message": "Price is required."}, status=400)

        try:
            price_val = float(estimated_price)
            if price_val <= 0:
                return jsonify({"status": False, "success": False, "message": "Price must be greater than zero."}, status=400)
        except (ValueError, TypeError):
            return jsonify({"status": False, "success": False, "message": "Price must be greater than zero."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check category
        cursor.execute("SELECT category_id FROM categories WHERE category_id = %s", (category_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "success": False, "message": "Category not found."}, status=404)

        cursor.execute(
            "INSERT INTO services (category_id, service_name, description, estimated_price, estimated_duration, status) VALUES (%s, %s, %s, %s, %s, 'Active')",
            (category_id, service_name, description, price_val, estimated_duration)
        )
        srv_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "success": True,
            "message": "Service created successfully.",
            "service": {
                "service_id": srv_id,
                "category_id": category_id,
                "service_name": service_name,
                "description": description,
                "estimated_price": price_val,
                "estimated_duration": estimated_duration,
                "status": "Active"
            }
        }, status=201)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "success": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
@admin_required
def update_service(request, service_id):
    try:
        data = get_json_data(request)
        category_id = data.get("category_id")
        service_name = data.get("service_name")
        description = data.get("description")
        estimated_price = data.get("estimated_price")
        estimated_duration = data.get("estimated_duration")
        status = data.get("status")

        if estimated_price is not None:
            if str(estimated_price).strip() == "":
                return jsonify({"status": False, "success": False, "message": "Price is required."}, status=400)
            try:
                price_val = float(estimated_price)
                if price_val <= 0:
                    return jsonify({"status": False, "success": False, "message": "Price must be greater than zero."}, status=400)
            except (ValueError, TypeError):
                return jsonify({"status": False, "success": False, "message": "Price must be greater than zero."}, status=400)

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM services WHERE service_id = %s", (service_id,))
        service = cursor.fetchone()

        if not service:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "success": False, "message": "Service not found."}, status=404)

        cat_id = category_id if category_id is not None else service["category_id"]
        name = service_name if service_name is not None else service["service_name"]
        desc = description if description is not None else service["description"]
        price = float(estimated_price) if estimated_price is not None else service["estimated_price"]
        duration = estimated_duration if estimated_duration is not None else service["estimated_duration"]
        stat = status if status is not None else service["status"]

        if price is None or float(price) <= 0:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "success": False, "message": "Price must be greater than zero."}, status=400)

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
        }, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
@admin_required
def delete_service(request, service_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM services WHERE service_id = %s", (service_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Service not found."}, status=404)

        # Set status to Inactive instead of physical delete
        cursor.execute("UPDATE services SET status = 'Inactive' WHERE service_id = %s", (service_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Service deactivated successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# REFUND PAYMENT
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def refund_payment(request, booking_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["payment_status"] != 'Paid':
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Refund can only be issued for Paid bookings."}, status=400)

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
        return jsonify({"status": True, "message": "Payment refunded successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# ADMIN LIST ENDPOINTS
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_providers(request):
    try:
        status_filter = request.GET.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT provider_id, business_name, owner_name, email, phone, category_id,
               address, city, state, pincode, experience_years, description,
               average_rating, total_reviews, status, email_verified, last_login, created_at
        FROM providers
        WHERE 1=1
        """
        params = []
        if status_filter:
            query += " AND status = %s"
            params.append(status_filter)

        # Safe soft-delete filter — only applied if column exists
        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        providers = cursor.fetchall()

        # Fetch documents for each provider so ID proof is available in all tabs
        for p in providers:
            cursor.execute(
                "SELECT document_id, document_type, file_path, verification_status, uploaded_at FROM provider_documents WHERE provider_id = %s",
                (p["provider_id"],)
            )
            docs = cursor.fetchall()
            for d in docs:
                if d.get("uploaded_at"):
                    d["uploaded_at"] = d["uploaded_at"].isoformat()
            p["documents"] = docs

        cursor.close()
        conn.close()

        for p in providers:
            # Map database statuses → frontend values
            if p.get("status") == "Approved":
                p["status"] = "Active"
            elif p.get("status") == "Suspended":
                p["status"] = "Blocked"

            if p.get("average_rating") is not None:
                p["average_rating"] = float(p["average_rating"])
            if p.get("created_at"):
                p["created_at"] = p["created_at"].isoformat()
            if p.get("last_login"):
                p["last_login"] = p["last_login"].isoformat()
            # Aliases for frontend
            p["full_name"] = p.get("business_name") or p.get("owner_name") or ""

        return jsonify({"status": True, "providers": providers, "total": len(providers)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_provider_approval_list(request):
    """List providers with Pending status for approval queue."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT provider_id, business_name, owner_name, email, phone, category_id,
                   address, city, state, pincode, experience_years, description,
                   average_rating, total_reviews, status, email_verified, created_at
            FROM providers
            WHERE status = 'Pending'
            ORDER BY created_at ASC
        """)
        providers = cursor.fetchall()

        # For each provider, fetch their documents
        for p in providers:
            cursor.execute(
                "SELECT document_id, document_type, file_path, verification_status, uploaded_at FROM provider_documents WHERE provider_id = %s",
                (p["provider_id"],)
            )
            docs = cursor.fetchall()
            for d in docs:
                if d.get("uploaded_at"):
                    d["uploaded_at"] = d["uploaded_at"].isoformat()
            p["documents"] = docs

            if p.get("average_rating") is not None:
                p["average_rating"] = float(p["average_rating"])
            if p.get("created_at"):
                p["created_at"] = p["created_at"].isoformat()
            # Map database statuses → frontend values
            if p.get("status") == "Approved":
                p["status"] = "Active"
            elif p.get("status") == "Suspended":
                p["status"] = "Blocked"

            p["full_name"] = p.get("business_name") or p.get("owner_name") or ""

        cursor.close()
        conn.close()

        return jsonify({"status": True, "providers": providers, "total": len(providers)}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_get_provider(request, provider_id):
    """Get a single provider detail with booking counts."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT provider_id, business_name, owner_name, email, phone, profile_image, category_id,
                   address, city, state, pincode, experience_years, description,
                   average_rating, total_reviews, status, email_verified, last_login, created_at
            FROM providers WHERE provider_id = %s
        """, (provider_id,))
        provider = cursor.fetchone()

        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Booking counts
        cursor.execute("SELECT COUNT(*) as total FROM bookings WHERE provider_id = %s", (provider_id,))
        provider["total_bookings"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = %s AND booking_status = 'Completed'", (provider_id,))
        provider["completed_bookings"] = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings WHERE provider_id = %s AND booking_status IN ('Pending', 'Accepted', 'In Progress', 'Finished')", (provider_id,))
        provider["pending_jobs"] = cursor.fetchone()["cnt"]

        # Services offered
        cursor.execute("""
            SELECT ps.provider_service_id, s.service_name, ps.service_charge as price, s.service_name
            FROM provider_services ps
            JOIN services s ON s.service_id = ps.service_id
            WHERE ps.provider_id = %s
        """, (provider_id,))
        provider["services_offered"] = cursor.fetchall()

        # Documents
        cursor.execute("SELECT document_id, document_type, file_path, verification_status, uploaded_at FROM provider_documents WHERE provider_id = %s", (provider_id,))
        docs = cursor.fetchall()
        for d in docs:
            if d.get("uploaded_at"):
                d["uploaded_at"] = d["uploaded_at"].isoformat()
        provider["documents"] = docs

        cursor.close()
        conn.close()

        if provider.get("status") == "Approved":
            provider["status"] = "Active"
        elif provider.get("status") == "Suspended":
            provider["status"] = "Blocked"

        if provider.get("average_rating") is not None:
            provider["average_rating"] = float(provider["average_rating"])
        if provider.get("created_at"):
            provider["created_at"] = provider["created_at"].isoformat()
        if provider.get("last_login"):
            provider["last_login"] = provider["last_login"].isoformat()
        provider["full_name"] = provider.get("business_name") or provider.get("owner_name") or ""

        return jsonify({"status": True, "provider": provider}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_update_provider(request, provider_id):
    """Update a provider record (admin editing)."""
    try:
        data = get_json_data(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM providers WHERE provider_id = %s", (provider_id,))
        provider = cursor.fetchone()
        if not provider:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        new_name = data.get("full_name") or data.get("owner_name") or data.get("business_name") or provider.get("business_name") or provider.get("owner_name") or ""
        phone = data.get("phone", provider["phone"])
        address = data.get("address", provider["address"])
        city = data.get("city", provider["city"])
        state = data.get("state", provider["state"])
        pincode = data.get("pincode", provider["pincode"])
        experience_years = data.get("experience_years", provider["experience_years"])
        description = data.get("description", provider["description"])
        status = data.get("status", provider["status"])
        if status == "Blocked":
            status = "Suspended"
        elif status == "Active":
            status = "Approved"

        cursor.execute("""
            UPDATE providers
            SET business_name=%s, owner_name=%s, phone=%s, address=%s, city=%s, state=%s,
                pincode=%s, experience_years=%s, description=%s, status=%s
            WHERE provider_id=%s
        """, (new_name, new_name, phone, address, city, state, pincode, experience_years, description, status, provider_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider updated successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_delete_provider(request, provider_id):
    """Soft-delete a provider."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Soft-delete: use deleted_at if column exists, otherwise set status to Rejected
        try:
            cursor.execute("UPDATE providers SET deleted_at = NOW() WHERE provider_id = %s", (provider_id,))
        except Exception:
            cursor.execute("UPDATE providers SET status = 'Rejected' WHERE provider_id = %s", (provider_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider deleted successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def block_provider(request, provider_id):
    """Block a provider — sets status to 'Blocked'."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        # Use 'Suspended' in the database (mapped to 'Blocked' on read/write boundary)
        cursor.execute("UPDATE providers SET status = 'Suspended' WHERE provider_id = %s", (provider_id,))
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Blocked', 'Your provider account has been blocked by admin.', 0)",
            (provider_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider blocked successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def unblock_provider(request, provider_id):
    """Unblock/Re-approve a suspended provider."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT provider_id FROM providers WHERE provider_id = %s", (provider_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Provider not found."}, status=404)

        cursor.execute("UPDATE providers SET status = 'Approved' WHERE provider_id = %s", (provider_id,))
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'System', 'Account Unblocked', 'Your provider account has been reactivated by admin.', 0)",
            (provider_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Provider unblocked successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_customers(request):
    try:
        status_filter = request.GET.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT customer_id, full_name, email, phone, gender, address, city, state, pincode,
               status, email_verified, last_login, created_at
        FROM customers
        WHERE 1=1
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

        return jsonify({"status": True, "customers": customers, "total": len(customers)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_get_customer(request, customer_id):
    """Get a single customer detail with booking counts."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT customer_id, full_name, email, phone, gender, date_of_birth, profile_image,
                   address, city, state, pincode, status, email_verified, last_login, created_at
            FROM customers WHERE customer_id = %s
        """, (customer_id,))
        customer = cursor.fetchone()

        if not customer:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        cursor.execute("SELECT COUNT(*) as total FROM bookings WHERE customer_id = %s", (customer_id,))
        customer["total_bookings"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings WHERE customer_id = %s AND booking_status = 'Completed'", (customer_id,))
        customer["completed_bookings"] = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings WHERE customer_id = %s AND booking_status IN ('Pending', 'Accepted', 'In Progress', 'Finished')", (customer_id,))
        customer["active_bookings"] = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM bookings WHERE customer_id = %s AND booking_status = 'Cancelled'", (customer_id,))
        customer["cancelled_bookings"] = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM reviews WHERE customer_id = %s", (customer_id,))
        customer["reviews_given"] = cursor.fetchone()["cnt"]

        cursor.close()
        conn.close()

        for key in ["created_at", "last_login"]:
            if customer.get(key):
                customer[key] = customer[key].isoformat()
        if customer.get("date_of_birth"):
            customer["date_of_birth"] = customer["date_of_birth"].isoformat() if hasattr(customer["date_of_birth"], "isoformat") else str(customer["date_of_birth"])

        return jsonify({"status": True, "customer": customer}, status=200)
    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["PUT"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_update_customer(request, customer_id):
    """Update a customer record (admin editing)."""
    try:
        data = get_json_data(request)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
        customer = cursor.fetchone()
        if not customer:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        full_name = data.get("full_name", customer["full_name"])
        phone = data.get("phone", customer["phone"])
        gender = data.get("gender", customer["gender"])
        status = data.get("status", customer["status"])
        address = data.get("address", customer["address"])
        city = data.get("city", customer["city"])
        state = data.get("state", customer["state"])
        pincode = data.get("pincode", customer["pincode"])

        cursor.execute("""
            UPDATE customers
            SET full_name=%s, phone=%s, gender=%s, status=%s, address=%s, city=%s, state=%s, pincode=%s
            WHERE customer_id=%s
        """, (full_name, phone, gender, status, address, city, state, pincode, customer_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Customer updated successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_delete_customer(request, customer_id):
    """Soft-delete a customer."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        # Soft-delete: use deleted_at if column exists, otherwise set status to Blocked
        try:
            cursor.execute("UPDATE customers SET deleted_at = NOW() WHERE customer_id = %s", (customer_id,))
        except Exception:
            cursor.execute("UPDATE customers SET status = 'Blocked' WHERE customer_id = %s", (customer_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Customer deleted successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def unblock_customer(request, customer_id):
    """Unblock a previously blocked customer."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s", (customer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Customer not found."}, status=404)

        cursor.execute("UPDATE customers SET status = 'Active' WHERE customer_id = %s", (customer_id,))
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'System', 'Account Unblocked', 'Your account has been reactivated by admin.', 0)",
            (customer_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Customer unblocked successfully."}, status=200)
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_categories(request):
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

        return jsonify({"status": True, "categories": categories, "total": len(categories)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_services(request):
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

        return jsonify({"status": True, "services": services, "total": len(services)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_bookings(request):
    try:
        status_filter = request.GET.get("status")
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT b.*,
               s.service_name,
               c.full_name AS customer_name, c.email AS customer_email,
               COALESCE(p.business_name, p.owner_name) AS provider_name, p.email AS provider_email
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

        return jsonify({"status": True, "bookings": bookings, "total": len(bookings)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_list_reviews(request):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*,
                   c.full_name AS customer_name,
                   COALESCE(p.business_name, p.owner_name) AS provider_name
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

        return jsonify({"status": True, "reviews": reviews, "total": len(reviews)}, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)

# ====================================================
# ADMIN BOOKING CANCEL
# ====================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_cancel_booking(request, booking_id):
    """Admin can cancel any active booking."""
    try:
        data = get_json_data(request)
        reason = data.get("reason", "Cancelled by admin")

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Booking not found."}, status=404)

        if booking["booking_status"] in ("Cancelled", "Completed"):
            cursor.close()
            conn.close()
            return jsonify({
                "status": False,
                "message": f"Booking is already {booking['booking_status']} and cannot be cancelled."
            }, status=400)

        old_status = booking["booking_status"]

        # Update booking
        cursor.execute(
            "UPDATE bookings SET booking_status = 'Cancelled', cancellation_reason = %s, cancelled_by = 'Admin', cancelled_at = NOW() WHERE booking_id = %s",
            (reason, booking_id)
        )
        # Log to history
        cursor.execute(
            "INSERT INTO booking_history (booking_id, old_status, new_status, remarks, changed_by) VALUES (%s, %s, 'Cancelled', %s, 'Admin')",
            (booking_id, old_status, reason)
        )
        # Notify customer
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Customer', %s, 'Booking', 'Booking Cancelled by Admin', %s, 0)",
            (booking["customer_id"], f"Your booking {booking['booking_number']} has been cancelled by admin. Reason: {reason}")
        )
        # Notify provider
        cursor.execute(
            "INSERT INTO notifications (user_type, user_id, notification_type, title, message, is_read) VALUES ('Provider', %s, 'Booking', 'Booking Cancelled by Admin', %s, 0)",
            (booking["provider_id"], f"Booking {booking['booking_number']} has been cancelled by admin. Reason: {reason}")
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Booking cancelled by admin successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# ADMIN REVIEW DELETE
# ====================================================

@api_view(["DELETE"])
@permission_classes([AllowAny])
@token_required
@admin_required
def admin_delete_review(request, review_id):
    """Admin can delete any review. Recalculates provider rating afterwards."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch review to get provider_id before deleting
        cursor.execute("SELECT * FROM reviews WHERE review_id = %s", (review_id,))
        review = cursor.fetchone()

        if not review:
            cursor.close()
            conn.close()
            return jsonify({"status": False, "message": "Review not found."}, status=404)

        provider_id = review["provider_id"]

        # Delete the review
        cursor.execute("DELETE FROM reviews WHERE review_id = %s", (review_id,))

        # Recalculate provider rating
        cursor.execute(
            "SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE provider_id = %s",
            (provider_id,)
        )
        stats = cursor.fetchone()
        avg_rating = round(float(stats["avg_r"]), 1) if stats["avg_r"] else 0.0
        total_rev = stats["cnt"] or 0

        cursor.execute(
            "UPDATE providers SET average_rating = %s, total_reviews = %s WHERE provider_id = %s",
            (avg_rating, total_rev, provider_id)
        )
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"status": True, "message": "Review deleted successfully."}, status=200)

    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)


# ====================================================
# ADMIN DASHBOARD — Enhanced with Recent Data
# ====================================================

@api_view(["GET"])
@permission_classes([AllowAny])
@token_required
@admin_required
def get_dashboard_recent(request):
    """Returns recent bookings and recent registrations for the dashboard."""
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Recent 5 bookings
        cursor.execute("""
            SELECT b.booking_id, b.booking_number, b.booking_status, b.estimated_price,
                   b.created_at, c.full_name AS customer_name, s.service_name
            FROM bookings b
            JOIN customers c ON b.customer_id = c.customer_id
            JOIN services s ON b.service_id = s.service_id
            ORDER BY b.created_at DESC
            LIMIT 5
        """)
        recent_bookings = cursor.fetchall()
        for b in recent_bookings:
            if b.get("created_at"):
                b["created_at"] = b["created_at"].isoformat()
            if b.get("estimated_price"):
                b["estimated_price"] = float(b["estimated_price"])

        # Recent 5 customer registrations
        cursor.execute("""
            SELECT customer_id, full_name, email, status, created_at
            FROM customers
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_customers = cursor.fetchall()
        for c in recent_customers:
            if c.get("created_at"):
                c["created_at"] = c["created_at"].isoformat()

        # Recent 5 provider registrations
        cursor.execute("""
            SELECT provider_id, business_name, owner_name, email, status, created_at
            FROM providers
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_providers = cursor.fetchall()
        for p in recent_providers:
            if p.get("created_at"):
                p["created_at"] = p["created_at"].isoformat()
            p["full_name"] = p.get("business_name") or p.get("owner_name") or ""
            # Map database statuses → frontend values
            if p.get("status") == "Approved":
                p["status"] = "Active"
            elif p.get("status") == "Suspended":
                p["status"] = "Blocked"

        cursor.close()
        conn.close()

        return jsonify({
            "status": True,
            "recent_bookings": recent_bookings,
            "recent_customers": recent_customers,
            "recent_providers": recent_providers
        }, status=200)

    except Exception as e:
        return jsonify({"status": False, "message": f"Server Error: {str(e)}"}, status=500)

