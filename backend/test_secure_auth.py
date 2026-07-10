import urllib.request
import urllib.error
import json
import random
import time
from database.db import get_connection

BASE_URL = "http://127.0.0.1:5000"

def make_request(url, method="GET", data=None, token=None):
    req = urllib.request.Request(url, method=method)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    if data is not None:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
        
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            body = response.read().decode('utf-8')
            return status_code, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"message": body}
    except Exception as e:
        return 500, {"message": str(e)}

def fetch_token_from_db(email, token_column):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT {token_column} FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return row[token_column]
    return None

def ensure_category_and_location():
    """
    Ensures at least one category and location exist in the database,
    and returns a valid (category_id, location_id) tuple.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Category
    cursor.execute("SELECT category_id FROM categories LIMIT 1")
    cat = cursor.fetchone()
    if not cat:
        print("No category found. Inserting test category...")
        cursor.execute("INSERT INTO categories (category_name) VALUES (%s)", ("Test Category",))
        conn.commit()
        category_id = cursor.lastrowid
    else:
        category_id = cat["category_id"]
        
    # Location
    cursor.execute("SELECT location_id FROM locations LIMIT 1")
    loc = cursor.fetchone()
    if not loc:
        print("No location found. Inserting test location...")
        cursor.execute(
            "INSERT INTO locations (city, area, state, pincode) VALUES (%s, %s, %s, %s)",
            ("TestCity", "TestArea", "TestState", "110022")
        )
        conn.commit()
        location_id = cursor.lastrowid
    else:
        location_id = loc["location_id"]
        
    cursor.close()
    conn.close()
    return category_id, location_id

def test_customer_flow():
    print("=== STARTING CUSTOMER AUTH FLOW TESTS ===")
    rand_id = random.randint(10000, 99999)
    email = f"cust_{rand_id}@example.com"
    password = "CustomerPassword123"
    
    # 1. Register Customer
    reg_data = {
        "full_name": "Test Customer Upgraded",
        "email": email,
        "password": password,
        "phone": "9998887776",
        "address": "123 Test Ave",
        "city": "Testville",
        "pincode": "110022"
    }
    
    status, res = make_request(f"{BASE_URL}/api/customer/register", "POST", reg_data)
    assert status == 201, f"Registration failed: {res}"
    print(f"  [PASS] Registration successful. Response: {res['message']}")
    
    # 2. Login before verification should be denied (403)
    login_data = {"email": email, "password": password}
    status, res = make_request(f"{BASE_URL}/api/customer/login", "POST", login_data)
    assert status == 403, f"Expected 403, got {status}: {res}"
    assert "verify your email" in res["message"], f"Unexpected message: {res['message']}"
    print(f"  [PASS] Login denied before email verification as expected. Response: {res['message']}")
    
    # 3. Retrieve verification token from database
    token = fetch_token_from_db(email, "verification_token")
    assert token is not None, "Verification token not found in database!"
    print(f"  [PASS] Verification token found in database: {token[:10]}...")
    
    # 4. Verify email
    status, res = make_request(f"{BASE_URL}/api/customer/verify-email", "POST", {"token": token})
    assert status == 200, f"Email verification failed: {res}"
    print(f"  [PASS] Email verified successfully. Response: {res['message']}")
    
    # 5. Login after verification
    status, res = make_request(f"{BASE_URL}/api/customer/login", "POST", login_data)
    assert status == 200, f"Login failed: {res}"
    assert "access_token" in res, "access_token missing in login response"
    assert "refresh_token" in res, "refresh_token missing in login response"
    access_token = res["access_token"]
    refresh_token = res["refresh_token"]
    print("  [PASS] Login successful after verification. Received access and refresh tokens.")
    
    # 6. Test Protected API (profile) with valid token
    status, res = make_request(f"{BASE_URL}/api/customer/profile", "GET", token=access_token)
    assert status == 200, f"Failed to fetch profile: {res}"
    assert res["user"]["email"] == email, f"Unexpected profile email: {res['user']['email']}"
    print("  [PASS] Accessed protected profile endpoint using JWT access token.")
    
    # 7. Test Protected API with invalid token (should return 401)
    status, res = make_request(f"{BASE_URL}/api/customer/profile", "GET", token="invalid_token")
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("  [PASS] Protected endpoint blocked unauthorized requests correctly.")
    
    # 8. Test Refresh Token
    status, res = make_request(f"{BASE_URL}/api/customer/refresh-token", "POST", {"refresh_token": refresh_token})
    assert status == 200, f"Token refresh failed: {res}"
    new_access_token = res["access_token"]
    print("  [PASS] Refreshed access token successfully using refresh token.")
    
    # Verify the new access token works
    status, res = make_request(f"{BASE_URL}/api/customer/profile", "GET", token=new_access_token)
    assert status == 200, f"New access token failed to authorize: {res}"
    print("  [PASS] Verified new access token works correctly.")
    
    # 9. Test Forgot Password
    status, res = make_request(f"{BASE_URL}/api/customer/forgot-password", "POST", {"email": email})
    assert status == 200, f"Forgot password failed: {res}"
    print(f"  [PASS] Forgot password requested. Response: {res['message']}")
    
    # Retrieve reset token from database
    reset_token = fetch_token_from_db(email, "password_reset_token")
    assert reset_token is not None, "Reset token not found in database!"
    print(f"  [PASS] Password reset token found in database: {reset_token[:10]}...")
    
    # Reset Password
    new_password = "NewStrongPassword123"
    status, res = make_request(f"{BASE_URL}/api/customer/reset-password", "POST", {"token": reset_token, "new_password": new_password})
    assert status == 200, f"Reset password failed: {res}"
    print(f"  [PASS] Password reset successfully. Response: {res['message']}")
    
    # Login with new password
    new_login_data = {"email": email, "password": new_password}
    status, res = make_request(f"{BASE_URL}/api/customer/login", "POST", new_login_data)
    assert status == 200, f"Login with new password failed: {res}"
    print("  [PASS] Logged in successfully using new password.")
    
    # 10. Test Logout
    status, res = make_request(f"{BASE_URL}/api/customer/logout", "POST", {"refresh_token": refresh_token})
    assert status == 200, f"Logout failed: {res}"
    print("  [PASS] Logged out successfully. Refresh token revoked.")
    
    # Attempt to refresh token again (should fail because it's deleted)
    status, res = make_request(f"{BASE_URL}/api/customer/refresh-token", "POST", {"refresh_token": refresh_token})
    assert status == 401, f"Expected 401 for revoked refresh token, got {status}: {res}"
    print("  [PASS] Revoked refresh token failed to fetch a new access token as expected.")
    
    print("Customer auth flow tests completed successfully!\n")

def test_provider_flow(category_id, location_id):
    print("=== STARTING PROVIDER AUTH FLOW TESTS ===")
    rand_id = random.randint(10000, 99999)
    email = f"prov_{rand_id}@example.com"
    password = "ProviderPassword123"
    
    # 1. Register Provider
    reg_data = {
        "full_name": "Test Provider Upgraded",
        "email": email,
        "password": password,
        "phone": "8887776665",
        "address": "456 Service St",
        "city": "Testville",
        "pincode": "110022",
        "category_id": category_id,
        "location_id": location_id,
        "business_name": "Upgraded Repairs",
        "experience": "5 Years",
        "description": "Premium service repairs",
        "price_per_hour": 150.00,
        "availability": "9 AM - 6 PM",
        "profile_image": "http://example.com/profile.jpg"
    }
    
    status, res = make_request(f"{BASE_URL}/api/provider/register", "POST", reg_data)
    assert status == 201, f"Registration failed: {res}"
    print(f"  [PASS] Registration successful. Response: {res['message']}")
    
    # 2. Login before verification should be denied (403)
    login_data = {"email": email, "password": password}
    status, res = make_request(f"{BASE_URL}/api/provider/login", "POST", login_data)
    assert status == 403, f"Expected 403, got {status}: {res}"
    assert "verify your email" in res["message"], f"Unexpected message: {res['message']}"
    print(f"  [PASS] Login denied before email verification as expected. Response: {res['message']}")
    
    # 3. Retrieve verification token from database
    token = fetch_token_from_db(email, "verification_token")
    assert token is not None, "Verification token not found in database!"
    print(f"  [PASS] Verification token found in database: {token[:10]}...")
    
    # 4. Verify email
    status, res = make_request(f"{BASE_URL}/api/provider/verify-email", "POST", {"token": token})
    assert status == 200, f"Email verification failed: {res}"
    print(f"  [PASS] Email verified successfully. Response: {res['message']}")
    
    # 5. Login after verification
    status, res = make_request(f"{BASE_URL}/api/provider/login", "POST", login_data)
    assert status == 200, f"Login failed: {res}"
    assert "access_token" in res, "access_token missing in login response"
    assert "refresh_token" in res, "refresh_token missing in login response"
    access_token = res["access_token"]
    refresh_token = res["refresh_token"]
    print("  [PASS] Login successful after verification. Received access and refresh tokens.")
    
    # 6. Test Protected API (profile) with valid token
    status, res = make_request(f"{BASE_URL}/api/provider/profile", "GET", token=access_token)
    assert status == 200, f"Failed to fetch profile: {res}"
    assert res["provider"]["email"] == email, f"Unexpected profile email: {res['provider']['email']}"
    print("  [PASS] Accessed protected provider profile endpoint using JWT access token.")
    
    # 7. Test Protected API with invalid token (should return 401)
    status, res = make_request(f"{BASE_URL}/api/provider/profile", "GET", token="invalid_token")
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("  [PASS] Protected endpoint blocked unauthorized requests correctly.")
    
    # 8. Test Refresh Token
    status, res = make_request(f"{BASE_URL}/api/provider/refresh-token", "POST", {"refresh_token": refresh_token})
    assert status == 200, f"Token refresh failed: {res}"
    new_access_token = res["access_token"]
    print("  [PASS] Refreshed access token successfully using refresh token.")
    
    # Verify the new access token works
    status, res = make_request(f"{BASE_URL}/api/provider/profile", "GET", token=new_access_token)
    assert status == 200, f"New access token failed to authorize: {res}"
    print("  [PASS] Verified new access token works correctly.")
    
    # 9. Test Forgot Password
    status, res = make_request(f"{BASE_URL}/api/provider/forgot-password", "POST", {"email": email})
    assert status == 200, f"Forgot password failed: {res}"
    print(f"  [PASS] Forgot password requested. Response: {res['message']}")
    
    # Retrieve reset token from database
    reset_token = fetch_token_from_db(email, "password_reset_token")
    assert reset_token is not None, "Reset token not found in database!"
    print(f"  [PASS] Password reset token found in database: {reset_token[:10]}...")
    
    # Reset Password
    new_password = "NewStrongPassword123"
    status, res = make_request(f"{BASE_URL}/api/provider/reset-password", "POST", {"token": reset_token, "new_password": new_password})
    assert status == 200, f"Reset password failed: {res}"
    print(f"  [PASS] Password reset successfully. Response: {res['message']}")
    
    # Login with new password
    new_login_data = {"email": email, "password": new_password}
    status, res = make_request(f"{BASE_URL}/api/provider/login", "POST", new_login_data)
    assert status == 200, f"Login with new password failed: {res}"
    print("  [PASS] Logged in successfully using new password.")
    
    # 10. Test Logout
    status, res = make_request(f"{BASE_URL}/api/provider/logout", "POST", {"refresh_token": refresh_token})
    assert status == 200, f"Logout failed: {res}"
    print("  [PASS] Logged out successfully. Refresh token revoked.")
    
    # Attempt to refresh token again (should fail because it's deleted)
    status, res = make_request(f"{BASE_URL}/api/provider/refresh-token", "POST", {"refresh_token": refresh_token})
    assert status == 401, f"Expected 401 for revoked refresh token, got {status}: {res}"
    print("  [PASS] Revoked refresh token failed to fetch a new access token as expected.")
    
    print("Provider auth flow tests completed successfully!\n")

if __name__ == "__main__":
    print("=== STARTING AUTHENTICATION SYSTEM TESTS ===\n")
    try:
        # Check and ensure category/location exist for provider foreign keys
        cat_id, loc_id = ensure_category_and_location()
        print(f"Using category_id={cat_id} and location_id={loc_id} for service provider tests.\n")
        
        test_customer_flow()
        test_provider_flow(cat_id, loc_id)
        print("ALL TESTS PASSED SUCCESSFULLY! The upgraded secure authentication system is working perfectly.")
    except AssertionError as e:
        print(f"\n[TEST FAILED] AssertionError: {e}")
    except Exception as e:
        print(f"\n[TEST ERROR] Unexpected Exception: {e}")
