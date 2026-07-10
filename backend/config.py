import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", 3306)),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "local_service_db"),
    "charset": os.environ.get("DB_CHARSET", "utf8mb4"),
}

# Allow optional custom SSL CA certificate path if provided in the environment
ssl_ca = os.environ.get("DB_SSL_CA")
if ssl_ca:
    DB_CONFIG["ssl_ca"] = ssl_ca
