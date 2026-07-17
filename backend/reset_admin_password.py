import bcrypt
from database.db import get_connection

password = "admin123"
hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

conn = get_connection()
cursor = conn.cursor()

# Update both admins
cursor.execute("UPDATE admins SET password_hash = %s WHERE email IN (%s, %s)", 
               (hashed_password, "admin@gmail.com", "admin@localservice.com"))
conn.commit()
print("Updated admin passwords in database successfully!")

cursor.close()
conn.close()
