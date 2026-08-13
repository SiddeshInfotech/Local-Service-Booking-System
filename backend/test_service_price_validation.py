import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory
from utils.auth_utils import generate_access_token
from route.admin import create_service, update_service
import json

def run_tests():
    print("========================================")
    print("RUNNING SERVICE PRICE VALIDATION TESTS")
    print("========================================")

    factory = RequestFactory()
    admin_token = generate_access_token(user_id=1, email="admin@example.com", role="Admin")

    # Fetch a valid category_id from database
    from database.db import get_connection
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT category_id FROM categories LIMIT 1")
    cat = cursor.fetchone()
    if not cat:
        cursor.execute("INSERT INTO categories (category_name, description, status) VALUES ('Test Category', 'For testing', 'Active')")
        conn.commit()
        cat_id = cursor.lastrowid
    else:
        cat_id = cat["category_id"]
    cursor.close()
    conn.close()

    # Helper function to invoke endpoint
    def call_api(view_func, method, path, data, service_id=None):
        if method == "POST":
            request = factory.post(path, data=json.dumps(data), content_type="application/json")
        elif method == "PUT":
            request = factory.put(path, data=json.dumps(data), content_type="application/json")
        request.headers = {"Authorization": f"Bearer {admin_token}"}
        request.current_user = {"user_id": 1, "email": "admin@example.com", "role": "Admin"}

        if service_id is not None:
            response = view_func(request, service_id=service_id)
        else:
            response = view_func(request)
        
        status_code = response.status_code
        content = json.loads(response.content.decode("utf-8"))
        return status_code, content

    passed_count = 0
    total_count = 0

    def assert_test(name, expected_status, expected_msg_substring, status_code, content):
        nonlocal passed_count, total_count
        total_count += 1
        msg = content.get("message", "")
        success = (status_code == expected_status) and (expected_msg_substring in msg if expected_msg_substring else True)
        if success:
            passed_count += 1
            print(f"[PASS] [{name}] Passed! Status: {status_code}, Response: {content}")
        else:
            print(f"[FAIL] [{name}] Failed! Expected status {expected_status}, got {status_code}. Response: {content}")
        return content

    # Test 1: Create Service with 100 -> Accepted
    payload_100 = {
        "category_id": cat_id,
        "service_name": "Test Service 100",
        "description": "Validation test 100",
        "estimated_price": 100,
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_100)
    created_srv = assert_test("100 -> Accepted", 201, "Service created successfully.", status, res)
    created_id = created_srv.get("service", {}).get("service_id") if created_srv.get("status") else None

    # Test 2: Create Service with 999 -> Accepted
    payload_999 = {
        "category_id": cat_id,
        "service_name": "Test Service 999",
        "description": "Validation test 999",
        "estimated_price": 999,
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_999)
    assert_test("999 -> Accepted", 201, "Service created successfully.", status, res)

    # Test 3: Create Service with 0 -> Rejected
    payload_0 = {
        "category_id": cat_id,
        "service_name": "Test Service Zero",
        "description": "Validation test 0",
        "estimated_price": 0,
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_0)
    assert_test("0 -> Rejected", 400, "Price must be greater than zero.", status, res)

    # Test 4: Create Service with -1 -> Rejected
    payload_neg1 = {
        "category_id": cat_id,
        "service_name": "Test Service Neg 1",
        "description": "Validation test -1",
        "estimated_price": -1,
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_neg1)
    assert_test("-1 -> Rejected", 400, "Price must be greater than zero.", status, res)

    # Test 5: Create Service with -899 -> Rejected
    payload_neg899 = {
        "category_id": cat_id,
        "service_name": "Test Service Neg 899",
        "description": "Validation test -899",
        "estimated_price": -899,
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_neg899)
    assert_test("-899 -> Rejected", 400, "Price must be greater than zero.", status, res)

    # Test 6: Create Service with Empty -> Required validation
    payload_empty = {
        "category_id": cat_id,
        "service_name": "Test Service Empty",
        "description": "Validation test empty",
        "estimated_price": "",
        "estimated_duration": 1
    }
    status, res = call_api(create_service, "POST", "/api/service", payload_empty)
    assert_test("Empty -> Required validation", 400, "Price is required.", status, res)

    # Test 7: Edit Service with negative price -> Rejected
    if created_id:
        update_neg = {
            "estimated_price": -500
        }
        status, res = call_api(update_service, "PUT", f"/api/service/{created_id}", update_neg, service_id=created_id)
        assert_test("Edit Service with negative price -> Rejected", 400, "Price must be greater than zero.", status, res)

        # Test 8: Edit Service with valid positive price -> Accepted
        update_pos = {
            "estimated_price": 250
        }
        status, res = call_api(update_service, "PUT", f"/api/service/{created_id}", update_pos, service_id=created_id)
        assert_test("Edit Service with positive price -> Accepted", 200, "Service updated successfully.", status, res)

    print("========================================")
    print(f"RESULTS: {passed_count}/{total_count} tests passed.")
    print("========================================")
    
    if passed_count != total_count:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
