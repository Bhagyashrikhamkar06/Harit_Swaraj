from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Customer
from schemas import CustomerCreate, CustomerResponse
from auth import get_current_user

router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@router.post("/register", response_model=CustomerResponse)
def register_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if customer already exists by customer_id (name/ID)
    db_customer = db.query(Customer).filter(Customer.customer_id == customer_in.customer_id).first()
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this identity already registered"
        )
    
    new_customer = Customer(**customer_in.dict())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.get("/all", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Customer).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer
