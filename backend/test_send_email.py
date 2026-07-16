import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils.email import send_email

res = send_email("chitteujwal721@gmail.com", "Test from Local Service App", "<h3>This is a verification test</h3>")
print("Result of send_email:", res)
