import asyncio
from fastapi import Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, BiomassHarvest
from routers.transport import record_transport
from fastapi import HTTPException

async def run_test():
    db_gen = get_db()
    db: Session = next(db_gen)
    
    user = db.query(User).filter(User.role == 'owner').first()
    if not user:
        print("No owner user found!")
        return

    # Call the endpoint handler directly
    try:
        res = await record_transport(
            transport_type="inbound",
            shipment_id="SHP-3872",
            vehicle_type="Truck",
            vehicle_number="MH-12-AB-1234",
            harvest_id="125",
            # other fields optional
            current_user=user,
            db=db
        )
        print("Success:", res)
    except HTTPException as e:
        print(f"HTTPException: {e.status_code} - {e.detail}")
    except Exception as e:
        print(f"Other Exception: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
