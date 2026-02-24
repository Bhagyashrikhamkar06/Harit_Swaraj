from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db
from models import User, Plot, BiomassHarvest, BiomassPreprocessing
from schemas import HarvestResponse, PreprocessingResponse, HarvestUpdate
from auth import get_current_user
from file_storage import save_photo

router = APIRouter(
    prefix="/harvest",
    tags=["Biomass Harvest"]
)

@router.post("/create", response_model=HarvestResponse, status_code=status.HTTP_201_CREATED)
async def create_harvest(
    biomass_batch_id: str = Form(...),
    plot_id: int = Form(...),
    actual_harvested_ton: float = Form(...),
    photo_1: UploadFile = File(...),
    photo_2: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record biomass harvest from a specific plot (Owner/Farmer)
    """
    # Check permissions
    if current_user.role not in ['owner', 'farmer']:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check plot ownership if farmer
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    # Save photos
    photo_path_1 = await save_photo(photo_1, f"harvest_{biomass_batch_id}_1")
    photo_path_2 = await save_photo(photo_2, f"harvest_{biomass_batch_id}_2")
    
    new_harvest = BiomassHarvest(
        biomass_batch_id=biomass_batch_id,
        plot_id=plot_id,
        actual_harvested_ton=actual_harvested_ton,
        photo_path_1=photo_path_1,
        photo_path_2=photo_path_2,
        user_id=current_user.id
    )
    
    db.add(new_harvest)
    db.commit()
    db.refresh(new_harvest)
    return new_harvest

@router.get("/list", response_model=List[HarvestResponse])
async def list_harvests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(BiomassHarvest)
    if current_user.role == 'farmer':
        query = query.filter(BiomassHarvest.user_id == current_user.id)
    return query.all()

@router.get("/{id}", response_model=HarvestResponse)
async def get_harvest(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    harvest = db.query(BiomassHarvest).filter(BiomassHarvest.id == id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
        
    if current_user.role == 'farmer' and harvest.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this harvest")
        
    return harvest

@router.put("/{id}", response_model=HarvestResponse)
async def update_harvest(
    id: int,
    harvest_update: HarvestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    harvest = db.query(BiomassHarvest).filter(BiomassHarvest.id == id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and harvest.user_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to update this harvest")

    update_data = harvest_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(harvest, key, value)
        
    db.commit()
    db.refresh(harvest)
    return harvest

@router.delete("/{id}")
async def delete_harvest(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    harvest = db.query(BiomassHarvest).filter(BiomassHarvest.id == id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
        
    if current_user.role not in ['admin', 'owner'] or (current_user.role == 'owner' and harvest.user_id != current_user.id):
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to delete this harvest")

    db.delete(harvest)
    db.commit()
    return {"message": "Harvest record deleted successfully"}

@router.post("/preprocess", response_model=PreprocessingResponse, status_code=status.HTTP_201_CREATED)
async def preprocess_biomass(
    harvest_id: int = Form(...),
    method: str = Form(...),
    photo_before: UploadFile = File(...),
    photo_after: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record biomass pre-processing (Owner)
    """
    if current_user.role != 'owner':
        raise HTTPException(status_code=403, detail="Only owners can record preprocessing")
        
    harvest = db.query(BiomassHarvest).filter(BiomassHarvest.id == harvest_id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="Harvest record not found")
        
    photo_before_path = await save_photo(photo_before, f"preprocess_{harvest_id}_before")
    photo_after_path = await save_photo(photo_after, f"preprocess_{harvest_id}_after")
    
    preprocess = BiomassPreprocessing(
        harvest_id=harvest_id,
        method=method,
        photo_before_path=photo_before_path,
        photo_after_path=photo_after_path
    )
    
    db.add(preprocess)
    db.commit()
    db.refresh(preprocess)
    return preprocess
