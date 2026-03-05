from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User
from auth import create_access_token
import io

client = TestClient(app)

db = SessionLocal()
user = db.query(User).filter(User.role == "owner").first()
if not user:
    print("No owner user found!")
    exit(1)

token = create_access_token(data={"sub": user.username})
headers = {"Authorization": f"Bearer {token}"}

data = {
    "transport_type": "inbound",
    "shipment_id": "SHP-9999",
    "vehicle_type": "Truck",
    "vehicle_number": "AB12CD",
    "mileage": 100,
    "route_from": "A",
    "route_to": "B",
    "quantity_kg": 500,
    "harvest_id": "111", # as requested by frontend
}

files = {
    "loading_photo": ("dummy.jpg", io.BytesIO(b"dummy image data"), "image/jpeg"),
    "unloading_photo": ("dummy2.jpg", io.BytesIO(b"dummy image data 2"), "image/jpeg"),
}

response = client.post("/transport/record", data=data, headers=headers)
print("Status Code:", response.status_code)
print("Response Body:", response.json())
