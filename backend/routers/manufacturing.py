from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, ManufacturingBatch, UnburnableProcess
from schemas import BatchResponse, UnburnableMethodResponse, BatchUpdate
from auth import get_current_user
from file_storage import save_video, save_photo
try:
    from ml.manufacturing_anomaly import get_anomaly_detector
except ImportError:
    from ml.mock_ml import get_anomaly_detector

router = APIRouter(
    prefix="/manufacturing",
    tags=["Manufacturing"]
)

anomaly_detector = get_anomaly_detector()

@router.post("/record", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_manufacturing_batch(
    batch_id: str = Form(...),
    biomass_input: float = Form(...),
    biochar_output: float = Form(...),
    kiln_type: str = Form(...),
    species: Optional[str] = Form(None),
    video: Optional[UploadFile] = File(None),
    photo: Optional[UploadFile] = File(None), # Add photo upload for biochar
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record manufacturing batch (Owner)
    - Includes ML verification and Rule-based checks
    """
    if current_user.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if db.query(ManufacturingBatch).filter(ManufacturingBatch.batch_id == batch_id).first():
        raise HTTPException(status_code=400, detail="Batch ID already exists")

    ratio = biochar_output / biomass_input
    co2_removed = biochar_output * 0.8 * (44 / 12)
    rule_status = "verified" if 0.20 <= ratio <= 0.30 else "flagged"

    try:
        ml_prediction = anomaly_detector.predict(
            biomass_input=biomass_input,
            biochar_output=biochar_output,
            kiln_type=kiln_type
        )
    except Exception:
        ml_prediction = {"ml_status": "error", "confidence_score": 0.0}

    final_status = "flagged" if (rule_status == "flagged" or ml_prediction.get("ml_status") == "flagged") else "verified"
    
    video_path = await save_video(video, batch_id) if video else None
    photo_path = await save_photo(photo, f"batch_{batch_id}") if photo else None
    
    new_batch = ManufacturingBatch(
        batch_id=batch_id,
        biomass_input=biomass_input,
        biochar_output=biochar_output,
        ratio=ratio,
        co2_removed=co2_removed,
        kiln_type=kiln_type,
        species=species,
        status=final_status,
        rule_status=rule_status,
        ml_prediction=ml_prediction,
        video_path=video_path,
        photo_path=photo_path,
        user_id=current_user.id
    )
    
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.get("/batches", response_model=List[BatchResponse])
async def get_batches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == 'owner':
        return db.query(ManufacturingBatch).filter(ManufacturingBatch.user_id == current_user.id).all()
    if current_user.role in ['admin', 'auditor']:
        return db.query(ManufacturingBatch).all()
    return []

@router.get("/batches/{id}", response_model=BatchResponse)
async def get_batch(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if current_user.role == 'owner' and batch.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this batch")
        
    return batch

@router.put("/batches/{id}", response_model=BatchResponse)
async def update_batch(
    id: int,
    batch_update: BatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and batch.user_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to update this batch")

    update_data = batch_update.dict(exclude_unset=True)
    
    # Re-calculate ratio and co2 if needed
    if 'biomass_input' in update_data or 'biochar_output' in update_data:
        biomass = update_data.get('biomass_input', batch.biomass_input)
        biochar = update_data.get('biochar_output', batch.biochar_output)
        batch.ratio = biochar / biomass
        batch.co2_removed = biochar * 0.8 * (44 / 12)
        batch.rule_status = "verified" if 0.20 <= batch.ratio <= 0.30 else "flagged"

    for key, value in update_data.items():
        if key not in ['ratio', 'co2_removed', 'rule_status']:
            setattr(batch, key, value)
        
    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/batches/{id}")
async def delete_batch(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and batch.user_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to delete this batch")

    db.delete(batch)
    db.commit()
    return {"message": "Batch deleted successfully"}

@router.post("/unburnable", response_model=UnburnableMethodResponse, status_code=status.HTTP_201_CREATED)
async def process_unburnable(
    batch_id: int = Form(...),
    method: str = Form(..., description="Mixing clay/other"),
    biochar_weight: float = Form(...),
    clay_weight: float = Form(...),
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record process of making biochar unburnable (Owner)
    """
    if current_user.role != 'owner':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    batch = db.query(ManufacturingBatch).filter(ManufacturingBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    photo_path = await save_photo(photo, f"unburnable_{batch_id}")
    
    process = UnburnableProcess(
        batch_id=batch_id,
        method=method,
        biochar_weight=biochar_weight,
        clay_weight=clay_weight,
        photo_path=photo_path
    )
    
    db.add(process)
    db.commit()
    db.refresh(process)
    return process
