import os
import smtplib
import threading
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Ensure dotenv is loaded with correct paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path)

def send_email(to_email, subject, body_html):
    """
    Sends an HTML email using SMTP configuration.
    """
    host = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    port_val = os.environ.get("EMAIL_PORT", "587")
    try:
        port = int(port_val)
    except ValueError:
        port = 587
        
    user = os.environ.get("EMAIL_USER")
    password = os.environ.get("EMAIL_PASSWORD")
    
    if not user or not password:
        print("Warning: EMAIL_USER or EMAIL_PASSWORD not configured. Skipping email dispatch.")
        print(f"--- EMAIL TO: {to_email} ---")
        print(f"--- SUBJECT: {subject} ---")
        print(f"--- BODY: ---\n{body_html}\n-----------------")
        return False

    msg = MIMEMultipart()
    msg['From'] = user
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body_html, 'html'))
    
    try:
        print(f"Attempting to send email to {to_email} via {host}:{port}...")
        server = smtplib.SMTP(host, port, timeout=15)
        server.starttls()
        server.login(user, password)
        server.sendmail(user, to_email, msg.as_string())
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        print("Full Traceback:")
        traceback.print_exc()
        # Print fallback to console so the link is still accessible in local development
        print(f"--- FALLBACK EMAIL TO: {to_email} ---")
        print(body_html)
        return False

def send_email_async(to_email, subject, body_html):
    """
    Sends an HTML email asynchronously in a background thread to prevent API blocking.
    """
    thread = threading.Thread(target=send_email, args=(to_email, subject, body_html))
    thread.daemon = True
    thread.start()

