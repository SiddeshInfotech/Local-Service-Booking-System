# Installation & Setup Guide

Follow these instructions to configure and run the Local Service Booking System database, Django backend API, and Vite React frontend development server.

---

## Prerequisites
Make sure you have the following software installed:
- Node.js (version 18 or above)
- NPM (version 9 or above)
- Python (version 3.9 or above)
- MySQL Server (version 8 or above)

---

## 1. Database Setup

1. **Create Database**:
   Create a clean MySQL schema database. You can host this locally or use a cloud database provider like Aiven Cloud:
   ```sql
   CREATE DATABASE localservice_db;
   ```
2. **Execute Migrations**:
   Run the migration scripts to initialize all tables, constraints, foreign key mappings, and indexes:
   ```bash
   python backend/database/db_migration.py
   python backend/database/db_upgrade.py
   ```

---

## 2. Backend Setup

1. **Create Virtual Environment**:
   Navigate to the repository folder and create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
2. **Activate Virtual Environment**:
   * On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
3. **Install Dependencies**:
   Install all package requirements listed in `requirements.txt`:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` folder and place the following parameters:
   ```env
   DJANGO_SETTINGS_MODULE=config.settings
   
   JWT_SECRET_KEY=super_secure_access_secret_key_123
   JWT_REFRESH_SECRET_KEY=super_secure_refresh_secret_key_123
   DB_HOST=your_mysql_host
   DB_PORT=your_mysql_port
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_mysql_database_name
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_email_app_password
   ```
5. **Run the Backend API**:
   Launch the Django server:
   ```bash
   python backend/app.py
   ```
   The Django backend server will launch at: `http://127.0.0.1:5000`

---

## 3. Frontend Setup

1. **Install Node Modules**:
   Install the Vite React frontend packages:
   ```bash
   npm install
   ```
2. **Run Vite Development Server**:
   Start the frontend React compiler:
   ```bash
   npm run dev
   ```
   The Vite compiler will launch the web application interface at: `http://localhost:3000`

---

## 4. Verification Check list
Once both servers are running:
- Open your browser to `http://localhost:3000`.
- Perform a Test Customer Signup. Check that the account is recorded in the MySQL database.
- Navigate to the admin login at `http://localhost:3000/admin/login` and authenticate using:
  - **Email**: `admin@gmail.com`
  - **Password**: `admin123`
- Inspect stats and categories in the admin dashboard to verify successful backend connectivity!
