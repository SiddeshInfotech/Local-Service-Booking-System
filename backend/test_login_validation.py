import bcrypt
from database.db import get_connection

conn = get_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT * FROM admins WHERE email = 'admin@gmail.com'")
admin = cursor.fetchone()
cursor.close()
conn.close()

print("Admin Row in DB:", admin)
input_pw = "admin123"

# Check standard matching
match = bcrypt.checkpw(input_pw.encode("utf-8"), admin["password_hash"].encode("utf-8"))
print("Bcrypt checkpw result:", match)
