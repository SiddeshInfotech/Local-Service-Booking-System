import urllib.request
import urllib.error
import json
import random

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(name, url, method="GET", data=None):
    print(f"Testing {name} ({method} {url})...")
    req = urllib.request.Request(url, method=method)
    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            body = response.read().decode('utf-8')
            try:
                parsed_body = json.loads(body)
            except json.JSONDecodeError:
                parsed_body = body
            print(f"  [SUCCESS] Status Code: {status_code}")
            print(f"  Response: {parsed_body}\n")
            return parsed_body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed_body = json.loads(body)
        except json.JSONDecodeError:
            parsed_body = body
        print(f"  [FAILED] Status Code: {e.code}")
        print(f"  Response: {parsed_body}\n")
        return None
    except Exception as e:
        print(f"  [ERROR] Could not connect to API: {e}\n")
        return None

if __name__ == "__main__":
    print("=== API SERVER TEST RUN ===\n")
    
    # 1. Test Home route
    test_endpoint("Home Route", f"{BASE_URL}/")
    
    # Generate unique email for registration test
    rand_id = random.randint(1000, 9999)
    test_email = f"testuser_{rand_id}@example.com"
    test_password = "password123"
    
    # 2. Test Customer Registration
    reg_data = {
        "full_name": "Test Customer",
        "email": test_email,
        "password": test_password,
        "phone": "9876543210",
        "address": "123 Testing Lane",
        "city": "TestCity",
        "pincode": "123456"
    }
    test_endpoint("Customer Registration", f"{BASE_URL}/api/customer/register", "POST", reg_data)
    
    # 3. Test Customer Login
    login_data = {
        "email": test_email,
        "password": test_password
    }
    test_endpoint("Customer Login", f"{BASE_URL}/api/customer/login", "POST", login_data)
