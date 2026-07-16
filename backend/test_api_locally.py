import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
import json

client = app.test_client()

res = client.post("/api/admin/login", json={
    "email": "admin@gmail.com",
    "password": "admin123"
})

print("Status Code:", res.status_code)
print("Data:", json.loads(res.data.decode("utf-8")))
