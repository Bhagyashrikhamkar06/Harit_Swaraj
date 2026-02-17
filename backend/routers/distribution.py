from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, Distribution, BiocharApplication, ManufacturingBatch
from schemas import DistributionResponse, ApplicationResponse, DistributionUpdate
from auth import get_current_user
from file_storage import save_photo, save_kml

router = APIRouter(
    prefix="/distribution",
    tags=["Distribution & Application"]
)

@router.post("/record", response_model=DistributionResponse, status_code=status.HTTP_201_CREATED)
async def record_distribution(
    batch_id: int = Form(...),
    customer_id: Optional[str] = Form(None),
    planned_use: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    quantity_kg: float = Form(...),
    amount_rs: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record sale/distribution of biochar (Owner)
    """
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check batch existence
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    dist = Distribution(
        batch_id=batch_id,
        customer_id=customer_id,
        planned_use=planned_use,
        location=location,
        quantity_kg=quantity_kg,
        amount_rs=amount_rs
    )
    
    db.add(dist)
    db.commit()
    db.refresh(dist)
    return dist

@router.post("/application", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def record_application(
    distribution_id: int = Form(...),
    purpose: str = Form(..., description="Agriculture/Horticulture"),
    photo: UploadFile = File(...),
    kml_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record application of biochar in the field (Farmer/Customer)
    """
    # Check distribution existence
    dist = db.query(Distribution).filter(Distribution.id == distribution_id).first()
    if not dist:
        raise HTTPException(status_code=404, detail="Distribution record not found")
        
    photo_path = await save_photo(photo, f"application_{distribution_id}")
    kml_path = await save_kml(kml_file, f"application_{distribution_id}")
    
    app = BiocharApplication(
        distribution_id=distribution_id,
        purpose=purpose,
        photo_path=photo_path,
        kml_file_path=kml_path
    )
    
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.get("/list", response_model=List[DistributionResponse])
async def list_distributions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == 'owner':
        # Get distributions for batches owned by user
        return db.query(Distribution).join(ManufacturingBatch).filter(ManufacturingBatch.user_id == current_user.id).all()
    if current_user.role == 'admin':
        return db.query(Distribution).all()
    return []

@router.get("/{id}", response_model=DistributionResponse)
async def get_distribution(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dist = db.query(Distribution).filter(Distribution.id == id).first()
    if not dist:
        raise HTTPException(status_code=404, detail="Distribution not found")
        
    # Check ownership if not admin
    if current_user.role == 'owner':
        batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == dist.batch_id).first()
        if not batch or batch.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this distribution")
            
    return dist

@router.put("/{id}", response_model=DistributionResponse)
async def update_distribution(
    id: int,
    dist_update: DistributionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dist = db.query(Distribution).filter(Distribution.id == id).first()
    if not dist:
        raise HTTPException(status_code=404, detail="Distribution not found")
        
    if current_user.role == 'owner':
        batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == dist.batch_id).first()
        if not batch or batch.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this distribution")
    elif current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = dist_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dist, key, value)
        
    db.commit()
    db.refresh(dist)
    return dist

@router.delete("/{id}")
async def delete_distribution(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dist = db.query(Distribution).filter(Distribution.id == id).first()
    if not dist:
        raise HTTPException(status_code=404, detail="Distribution not found")
        
    if current_user.role == 'owner':
        batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == dist.batch_id).first()
        if not batch or batch.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this distribution")
    elif current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(dist)
    db.commit()
    return {"message": "Distribution deleted successfully"}
