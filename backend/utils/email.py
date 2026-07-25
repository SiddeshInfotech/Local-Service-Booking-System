import os
import smtplib
import threading
import traceback
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv


# Ensure dotenv is loaded with correct paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path)

def send_email_detailed(to_email, subject, body_html):
    """
    Sends an HTML email using SMTP configuration.
    Supports both TLS (port 587) and SSL (port 465).
    Returns (success: bool, detail_msg: str).
    """
    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port_val = os.getenv("EMAIL_PORT", "587")

    try:
        port = int(port_val)
    except (ValueError, TypeError):
        port = 587

    import socket
    print("Resolved addresses:")
    print(socket.getaddrinfo(host, port))

    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASSWORD")
    sender = os.getenv("EMAIL_FROM") or user

    # Sanitize App Password
    if password:
        password = password.replace(" ", "").strip()
    if user:
        user = user.strip()

    use_ssl = (port == 465) or (
        os.getenv("EMAIL_USE_SSL", "false").lower() == "true"
    )
    use_tls = (port == 587) or (
        os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
    )

    if not user or not password:
        msg = "SMTP configuration missing: EMAIL_USER or EMAIL_PASSWORD environment variables are not set."
        print(f"[SMTP ERROR] {msg}")
        return False, msg

    if not to_email or "@" not in str(to_email):
        msg = f"Invalid recipient email address: '{to_email}'"
        print(f"[EMAIL ERROR] {msg}")
        return False, msg

    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    server = None

    try:
        print(f"[SMTP CONNECT] Connecting to {host}:{port}")
        print(f"[SMTP USER] {user}")
        print(f"[SMTP TLS] {use_tls}")
        print(f"[SMTP SSL] {use_ssl}")

        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
            server.ehlo()
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.ehlo()

            if use_tls:
                server.starttls()
                server.ehlo()

        print(f"[SMTP AUTH] Authenticating as {user}...")
        server.login(user, password)

        print(f"[SMTP SEND] Delivering mail to {to_email}...")
        server.sendmail(sender, [to_email], msg.as_string())

        print(f"[SMTP SUCCESS] Email successfully delivered to {to_email}")

        return True, "Email sent successfully."

    except smtplib.SMTPAuthenticationError as auth_err:
        err_msg = f"SMTP Authentication failed: {auth_err}"
        print(err_msg)
        traceback.print_exc()
        return False, err_msg

    except smtplib.SMTPConnectError as conn_err:
        err_msg = f"SMTP Connection failed: {conn_err}"
        print(err_msg)
        traceback.print_exc()
        return False, err_msg

    except smtplib.SMTPException as smtp_err:
        err_msg = f"SMTP Error: {smtp_err}"
        print(err_msg)
        traceback.print_exc()
        return False, err_msg

    except Exception as e:
        err_msg = f"Failed to send email: {e}"
        print(err_msg)
        traceback.print_exc()
        return False, err_msg

    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass

def send_email(to_email, subject, body_html):
    """
    Sends an HTML email using SMTP configuration.
    Returns boolean (True on success, False on failure).
    """
    success, _ = send_email_detailed(to_email, subject, body_html)
    return success

def send_email_async(to_email, subject, body_html):
    """
    Sends an HTML email asynchronously in a background thread to prevent API blocking.
    """
    def worker():
        send_email_detailed(to_email, subject, body_html)
        
    thread = threading.Thread(target=worker)
    thread.daemon = True
    thread.start()

def get_base_template(content_html):
    year = datetime.datetime.now().year
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fixora</title>
  <style>
    body {{
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0A0A0A;
      color: #E0E0E0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #0A0A0A;
      padding: 40px 0;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #121212;
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%);
      padding: 30px 40px;
      text-align: center;
      border-bottom: 2px solid #D4AF37;
    }}
    .logo {{
      color: #D4AF37;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 3px;
      margin: 0;
      text-transform: uppercase;
    }}
    .subtitle {{
      color: #888;
      font-size: 12px;
      margin: 5px 0 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }}
    .content {{
      padding: 40px;
      line-height: 1.6;
    }}
    .footer {{
      background-color: #0D0D0D;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #222;
      color: #666;
      font-size: 12px;
    }}
    .footer a {{
      color: #D4AF37;
      text-decoration: none;
    }}
    .btn {{
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #F4C542 0%, #D4AF37 100%);
      color: #0D0D0D !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 30px;
      margin: 20px 0;
      text-transform: uppercase;
      font-size: 13px;
      letter-spacing: 1px;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
    }}
    .btn:hover {{
      background: linear-gradient(135deg, #FFE89C 0%, #F4C542 100%);
    }}
    .details-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #1A1A1A;
      border-radius: 8px;
      overflow: hidden;
    }}
    .details-table td {{
      padding: 12px 20px;
      border-bottom: 1px solid #262626;
      font-size: 14px;
    }}
    .details-table tr:last-child td {{
      border-bottom: none;
    }}
    .label {{
      color: #888;
      font-weight: 600;
      width: 40%;
    }}
    .value {{
      color: #FFF;
      text-align: right;
    }}
    .stars {{
      color: #D4AF37;
      font-size: 30px;
      margin: 15px 0;
      letter-spacing: 5px;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">FIXORA</h1>
        <p class="subtitle">Trusted Local Services</p>
      </div>
      <div class="content">
        {content_html}
      </div>
      <div class="footer">
        <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        <p style="margin: 10px 0 0;">Need help? Contact <a href="mailto:support@fixora.in">support@fixora.in</a></p>
        <p style="margin: 15px 0 0;">&copy; {year} Fixora. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>"""

def get_otp_email_template(name, otp_code):
    html = f"""
    <h2 style="color: #FFF; margin-top: 0;">Hello {name},</h2>
    <p>We received a request to verify your account or reset your password. Please use the following 6-digit One-Time Password (OTP) to proceed:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 20px; background-color: #1A1A1A; text-align: center; border-radius: 8px; margin: 25px 0; color: #D4AF37; border: 1px solid rgba(212, 175, 55, 0.3);">
        {otp_code}
    </div>
    <p>This OTP is valid for <strong>10 minutes</strong> and can only be used once. If you did not make this request, you can safely ignore this email.</p>
    """
    return get_base_template(html)

def get_password_reset_template(name, reset_link):
    html = f"""
    <h2 style="color: #FFF; margin-top: 0;">Hello {name},</h2>
    <p>You requested to reset your password for your Fixora account. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" class="btn">Reset Password</a>
    </div>
    <p>This link is valid for <strong>24 hours</strong>. If the button above doesn't work, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; font-size: 12px; color: #888;"><a href="{reset_link}" style="color: #D4AF37;">{reset_link}</a></p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    """
    return get_base_template(html)

def get_booking_confirmation_template(booking_number, customer_name, provider_name, service_name, booking_date, price, status):
    html = f"""
    <h2 style="color: #FFF; margin-top: 0;">Booking Confirmed!</h2>
    <p>Hello {customer_name}, your booking has been successfully confirmed. Below are the details:</p>
    <table class="details-table">
        <tr>
            <td class="label">Booking ID</td>
            <td class="value">{booking_number}</td>
        </tr>
        <tr>
            <td class="label">Service</td>
            <td class="value">{service_name}</td>
        </tr>
        <tr>
            <td class="label">Provider</td>
            <td class="value">{provider_name}</td>
        </tr>
        <tr>
            <td class="label">Estimated Price</td>
            <td class="value">₹{price}</td>
        </tr>
        <tr>
            <td class="label">Booking Date</td>
            <td class="value">{booking_date}</td>
        </tr>
        <tr>
            <td class="label">Status</td>
            <td class="value" style="color: #D4AF37; font-weight: bold;">{status}</td>
        </tr>
    </table>
    <p>Our service provider will contact you shortly before arrival. Thank you for choosing Fixora!</p>
    """
    return get_base_template(html)

def get_booking_completed_template(booking_number, customer_name, provider_name, service_name, booking_date, price, status):
    html = f"""
    <h2 style="color: #FFF; margin-top: 0;">Booking Completed! ✅</h2>
    <p>Hello {customer_name}, your booking has been successfully completed. Below are the details:</p>
    <table class="details-table">
        <tr>
            <td class="label">Booking ID</td>
            <td class="value">{booking_number}</td>
        </tr>
        <tr>
            <td class="label">Provider</td>
            <td class="value">{provider_name}</td>
        </tr>
        <tr>
            <td class="label">Service</td>
            <td class="value">{service_name}</td>
        </tr>
        <tr>
            <td class="label">Booking Date</td>
            <td class="value">{booking_date}</td>
        </tr>
        <tr>
            <td class="label">Final Price</td>
            <td class="value">₹{price}</td>
        </tr>
        <tr>
            <td class="label">Status</td>
            <td class="value" style="color: #00E676; font-weight: bold;">{status}</td>
        </tr>
    </table>
    <p>Thank you for choosing our platform!</p>
    """
    return get_base_template(html)

def get_review_request_template(booking_number, customer_name, provider_name, service_name, review_link):
    html = f"""
    <h2 style="color: #FFF; margin-top: 0; text-align: center;">How was your experience?</h2>
    <p>Hello {customer_name}, your booking <strong>{booking_number}</strong> with <strong>{provider_name}</strong> has been completed successfully.</p>
    <p>Please rate your experience to help us maintain a high level of service quality on our platform.</p>
    
    <div class="stars">
        ★★★★★
    </div>
    
    <div style="text-align: center; margin: 25px 0;">
        <a href="{review_link}" class="btn">Write a Review</a>
    </div>
    <p>If you have any questions or feedback, feel free to contact us.</p>
    """
    return get_base_template(html)
