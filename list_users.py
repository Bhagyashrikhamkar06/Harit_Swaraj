from backend.database import SessionLocal
from backend.models import User

db = SessionLocal()
users = db.query(User).all()

print(f"{'ID':<5} {'Username':<20} {'Role':<10} {'Full Name'}")
print("-" * 60)
for u in users:
    print(f"{u.id:<5} {u.username:<20} {u.role:<10} {u.full_name}")

db.close()
