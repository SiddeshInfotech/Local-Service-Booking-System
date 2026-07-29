import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)
load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
    "database": os.getenv("DB_NAME", "local_service_db"),
    "charset": os.getenv("DB_CHARSET", "utf8mb4"),
}


ssl_ca = os.getenv("DB_SSL_CA")
if ssl_ca:
    DB_CONFIG["ssl_ca"] = ssl_ca