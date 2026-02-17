from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import json

from database import get_db
from models import User, Audit, Plot
from schemas import AuditResponse
from auth import get_current_user
from file_storage import save_photo

router = APIRouter(
    prefix="/audit",
    tags=["Independent Audit"]
)

@router.post("/submit", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def submit_audit(
    type: str = Form(..., description="'field', 'manufacturing', 'application'"),
    plot_id: Optional[int] = Form(None),
    
    # Field Audit
    satellite_land_use: Optional[str] = Form(None),
    observed_land_use: Optional[str] = Form(None),
    
    # Manufacturing Audit
    facility_location_check: Optional[bool] = Form(None),
    inbound_biomass_data: Optional[str] = Form(None), # JSON string
    actual_biomass_data: Optional[str] = Form(None), # JSON string
    biochar_production_data: Optional[str] = Form(None), # JSON string
    
    # Application Audit
    application_plot_id: Optional[str] = Form(None),
    biochar_presence_verified: Optional[bool] = Form(None),
    predicted_quantity_per_ha: Optional[float] = Form(None),
    
    # Photos (List of files)
    photos: List[UploadFile] = File(None),
    
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit independent audit report (Auditor)
    """
    if current_user.role != 'auditor':
        raise HTTPException(status_code=403, detail="Only auditors can submit audits")
        
    # Process photos
    photo_paths = []
    if photos:
        for idx, photo in enumerate(photos):
            path = await save_photo(photo, f"audit_{type}_{current_user.id}_{datetime.now().timestamp()}_{idx}")
            photo_paths.append(path)
            
    # Parse JSON fields if provided
    inbound_data = json.loads(inbound_biomass_data) if inbound_biomass_data else None
    actual_data = json.loads(actual_biomass_data) if actual_biomass_data else None
    prod_data = json.loads(biochar_production_data) if biochar_production_data else None
    
    audit = Audit(
        type=type,
        auditor_id=current_user.id,
        plot_id=plot_id,
        satellite_land_use=satellite_land_use,
        observed_land_use=observed_land_use,
        facility_location_check=facility_location_check,
        inbound_biomass_data=inbound_data,
        actual_biomass_data=actual_data,
        biochar_production_data=prod_data,
        application_plot_id=application_plot_id,
        biochar_presence_verified=biochar_presence_verified,
        predicted_quantity_per_ha=predicted_quantity_per_ha,
        photos=photo_paths
    )
    
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

@router.get("/list", response_model=List[AuditResponse])
async def list_audits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == 'auditor':
        return db.query(Audit).filter(Audit.auditor_id == current_user.id).all()
    if current_user.role in ['admin', 'owner']:
        return db.query(Audit).all()
    raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/{id}", response_model=AuditResponse)
async def get_audit(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit = db.query(Audit).filter(Audit.id == id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    if current_user.role == 'auditor' and audit.auditor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this audit")
        
    return audit

@router.delete("/{id}")
async def delete_audit(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    audit = db.query(Audit).filter(Audit.id == id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    if current_user.role != 'admin' and (current_user.role != 'auditor' or audit.auditor_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this audit")

    db.delete(audit)
    db.commit()
    return {"message": "Audit deleted successfully"}
