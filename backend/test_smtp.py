import os
import smtplib
from dotenv import load_dotenv

load_dotenv()

host = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
port_val = os.environ.get("EMAIL_PORT", "587")
try:
    port = int(port_val)
except ValueError:
    port = 587
    
user = os.environ.get("EMAIL_USER")
password = os.environ.get("EMAIL_PASSWORD")

print(f"SMTP Configuration:")
print(f"Host: {host}")
print(f"Port: {port}")
print(f"User: {user}")
print(f"Password length: {len(password) if password else 0}")

if not user or not password:
    print("Error: EMAIL_USER or EMAIL_PASSWORD not set in environment.")
    exit(1)

try:
    print("Connecting to SMTP server...")
    server = smtplib.SMTP(host, port, timeout=10)
    print("Sending STARTTLS...")
    server.starttls()
    print("Logging in...")
    server.login(user, password)
    print("Login successful!")
    server.quit()
except Exception as e:
    print(f"SMTP Connection/Login failed: {e}")
    import traceback
    traceback.print_exc()
