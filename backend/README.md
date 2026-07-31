# Local Service Booking System - Django Backend

This is the Django + Django REST Framework backend for the Local Service Booking System.

## Requirements

- Python 3.10+
- MySQL 8.0+

## Setup & Running Locally

1. Create and activate virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Ensure `.env` is configured with database and JWT credentials.

4. Run database upgrade/migration helper (if needed):
   ```bash
   python database/db_upgrade.py
   ```

5. Launch Django backend server:
   ```bash
   python manage.py runserver 5000
   ```

The backend server will run at `http://127.0.0.1:5000/`.