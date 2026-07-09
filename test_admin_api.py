import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(name, url, method="POST", data=None):
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
    print("=== ADMIN API SERVER TEST RUN ===\n")
    
    # 1. Test Valid Admin Login
    valid_login = {
        "email": "admin@gmail.com",
        "password": "admin123"
    }
    test_endpoint("Valid Admin Login", f"{BASE_URL}/api/admin/login", "POST", valid_login)
    
    # 2. Test Invalid Password
    invalid_password = {
        "email": "admin@gmail.com",
        "password": "wrong_password"
    }
    test_endpoint("Invalid Password Admin Login", f"{BASE_URL}/api/admin/login", "POST", invalid_password)

    # 3. Test Invalid Email
    invalid_email = {
        "email": "unknown_admin@gmail.com",
        "password": "admin123"
    }
    test_endpoint("Invalid Email Admin Login", f"{BASE_URL}/api/admin/login", "POST", invalid_email)
