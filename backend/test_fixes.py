import urllib.request
import urllib.error
import json
import random
import sys

BASE_URL = "http://127.0.0.1:5000"

def request_api(name, url, method="GET", data=None, token=None):
    print(f"Testing {name} ({method} {url})...")
    req = urllib.request.Request(url, method=method)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            body = response.read().decode('utf-8')
            parsed = json.loads(body)
            print(f"  [SUCCESS] {status_code}")
            return parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed = json.loads(body)
        except:
            parsed = body
        print(f"  [FAILED] {e.code} - {parsed}")
        return parsed
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None

def test_flow():
    # 1. Login Admin to get Token
    admin_login = request_api("Admin Login", f"{BASE_URL}/api/admin/login", "POST", {
        "email": "admin@gmail.com",
        "password": "Admin@1234"
    })
    if not admin_login or not admin_login.get("status"):
        print("Admin login failed! Aborting.")
        sys.exit(1)
    admin_token = admin_login["access_token"]
    print("Admin Token acquired.")

    # 2. Register a Provider with category string mapping
    rand_id = random.randint(10000, 99999)
    provider_email = f"provider_{rand_id}@example.com"
    provider_phone = f"9{rand_id:09d}"
    
    # We pass 'Electrician' category name
    prov_data = {
        "full_name": "Tesla Electric House",
        "email": provider_email,
        "password": "password123",
        "phone": provider_phone,
        "service": "Electrician",
        "city": "Shirpur",
        "experience": "5",
        "description": "Certified electrician services"
    }
    
    reg_res = request_api("Provider Registration (Mapping service to category_id)", f"{BASE_URL}/api/provider/register", "POST", prov_data)
    if not reg_res or not reg_res.get("status"):
        print("Provider registration failed!")
        sys.exit(1)
        
    # Let's inspect the registered provider in database
    import mysql.connector
    import os
    from dotenv import load_dotenv
    load_dotenv()
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM providers WHERE email=%s", (provider_email,))
    provider_row = cursor.fetchone()
    print("\nDatabase verification of provider category_id mapping:")
    print(f"  Email: {provider_row['email']}")
    print(f"  Category ID in DB: {provider_row['category_id']}")
    print(f"  Status in DB: {provider_row['status']}")
    
    if provider_row['category_id'] is None:
        print("❌ FAILED: category_id is not mapped!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: category_id mapped correctly.")

    # 3. Provider Login (Wait, it's auto-approved/verified for example.com)
    prov_login = request_api("Provider Login", f"{BASE_URL}/api/provider/login", "POST", {
        "email": provider_email,
        "password": "password123"
    })
    if not prov_login or not prov_login.get("status"):
        print("Provider login failed!")
        sys.exit(1)
    prov_token = prov_login["access_token"]
    provider_id = provider_row["provider_id"]

    # 4. Admin Block Provider (Should change status to Blocked/Suspended in DB)
    block_res = request_api("Admin Block Provider", f"{BASE_URL}/api/admin/provider/{provider_id}/block", "POST", {}, token=admin_token)
    
    # Check DB status
    cursor.execute("SELECT status FROM providers WHERE provider_id=%s", (provider_id,))
    blocked_status = cursor.fetchone()["status"]
    print(f"Blocked status in DB: {blocked_status}")
    
    # Verify mapping on GET
    get_prov = request_api("Get Blocked Provider Profile", f"{BASE_URL}/api/admin/provider/{provider_id}", "GET", token=admin_token)
    api_status = get_prov.get("provider", {}).get("status")
    print(f"API Returned status for blocked provider: {api_status}")
    if api_status != "Blocked":
        print("❌ FAILED: status not mapped to Blocked on API output!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: status mapped to Blocked on API output.")

    # 5. Verify Login is Blocked
    prov_login_blocked = request_api("Provider Login while Blocked", f"{BASE_URL}/api/provider/login", "POST", {
        "email": provider_email,
        "password": "password123"
    })
    print(f"Blocked login response status: {prov_login_blocked.get('status')} - message: {prov_login_blocked.get('message')}")
    if prov_login_blocked.get("status") is not False:
        print("❌ FAILED: login allowed while blocked!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: login blocked correctly.")

    # 6. Admin Unblock Provider
    unblock_res = request_api("Admin Unblock Provider", f"{BASE_URL}/api/admin/provider/{provider_id}/unblock", "POST", {}, token=admin_token)
    
    cursor.execute("SELECT status FROM providers WHERE provider_id=%s", (provider_id,))
    unblocked_status = cursor.fetchone()["status"]
    print(f"Unblocked status in DB: {unblocked_status}")
    
    # Verify Login again
    prov_login_unblocked = request_api("Provider Login after Unblock", f"{BASE_URL}/api/provider/login", "POST", {
        "email": provider_email,
        "password": "password123"
    })
    if not prov_login_unblocked.get("status"):
        print("❌ FAILED: login failed after unblocking!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: login works after unblock.")

    # 7. Check Admin Reports Date range
    reports_7d = request_api("Admin Reports (7 Days)", f"{BASE_URL}/api/admin/reports?range=7d", "GET", token=admin_token)
    print(f"Reports range parameter returned: {reports_7d.get('range')}")
    if reports_7d.get("range") != "Last 7 Days":
        print("❌ FAILED: range filtering name did not match!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: reports date range filter working.")

    # 8. Check Admin Dashboard Recent Data
    dashboard_recent = request_api("Admin Dashboard Recent Items", f"{BASE_URL}/api/admin/dashboard/recent", "GET", token=admin_token)
    if not dashboard_recent or not dashboard_recent.get("status"):
        print("❌ FAILED to get recent items!")
        sys.exit(1)
    else:
        print("✅ SUCCESS: dashboard recent items returned.")

    cursor.close()
    conn.close()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY! All fixes verified.")

if __name__ == "__main__":
    test_flow()
