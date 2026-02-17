from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, Transport, BiomassHarvest, Distribution
from schemas import TransportResponse, TransportUpdate
from auth import get_current_user
from file_storage import save_photo

router = APIRouter(
    prefix="/transport",
    tags=["Logistics"]
)

@router.post("/record", response_model=TransportResponse, status_code=status.HTTP_201_CREATED)
async def record_transport(
    transport_type: str = Form(..., description="'inbound' or 'outbound'"),
    shipment_id: str = Form(...),
    vehicle_type: Optional[str] = Form(None),
    vehicle_number: Optional[str] = Form(None),
    mileage: Optional[float] = Form(None),
    route_from: Optional[str] = Form(None),
    route_to: Optional[str] = Form(None),
    quantity_kg: Optional[float] = Form(None),
    
    # Links
    harvest_id: Optional[int] = Form(None),
    distribution_id: Optional[int] = Form(None),
    
    loading_photo: UploadFile = File(...),
    unloading_photo: UploadFile = File(...),
    
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record transport movement (Owner)
    - Inbound: Link to Harvest ID (Biomass -> Factory)
    - Outbound: Link to Distribution ID (Biochar -> Customer)
    """
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    loading_path = await save_photo(loading_photo, f"transport_{shipment_id}_load")
    unloading_path = await save_photo(unloading_photo, f"transport_{shipment_id}_unload")
    
    transport = Transport(
        shipment_id=shipment_id,
        type=transport_type,
        vehicle_type=vehicle_type,
        vehicle_number=vehicle_number,
        mileage=mileage,
        route_from=route_from,
        route_to=route_to,
        loading_photo_path=loading_path,
        unloading_photo_path=unloading_path,
        quantity_kg=quantity_kg,
        harvest_id=harvest_id,
        distribution_id=distribution_id
    )
    
    db.add(transport)
    db.commit()
    db.refresh(transport)
    return transport

@router.get("/list", response_model=List[TransportResponse])
async def list_transports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Transport).all()

@router.get("/{id}", response_model=TransportResponse)
async def get_transport(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transport = db.query(Transport).filter(Transport.id == id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transport record not found")
        
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return transport

@router.put("/{id}", response_model=TransportResponse)
async def update_transport(
    id: int,
    transport_update: TransportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transport = db.query(Transport).filter(Transport.id == id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transport record not found")
        
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = transport_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transport, key, value)
        
    db.commit()
    db.refresh(transport)
    return transport

@router.delete("/{id}")
async def delete_transport(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transport = db.query(Transport).filter(Transport.id == id).first()
    if not transport:
        raise HTTPException(status_code=404, detail="Transport record not found")
        
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(transport)
    db.commit()
    return {"message": "Transport record deleted successfully"}
