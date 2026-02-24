
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import get_current_user
from populate_sample_data import (
    clear_existing_data,
    create_sample_plots,
    create_sample_harvests,
    create_sample_transports,
    create_sample_preprocessing,
    create_sample_manufacturing_batches,
    create_sample_distributions,
    create_sample_applications,
    create_sample_audits
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.post("/populate-sample-data")
async def populate_sample_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Populate the database with sample data for demonstration purposes.
    Only accessible by users with 'admin' role.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action"
        )
    
    try:
        # Get demo users
        farmer = db.query(User).filter(User.username == "farmer1").first()
        owner = db.query(User).filter(User.username == "owner1").first()
        auditor = db.query(User).filter(User.username == "auditor1").first()
        
        if not all([farmer, owner, auditor]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Default demo users (farmer1, owner1, auditor1) not found. Please ensure users are created first."
            )
        
        # Clear existing data
        clear_existing_data(db)
        
        # Create sample data
        plots = create_sample_plots(db, farmer.id)
        harvests = create_sample_harvests(db, plots, farmer.id)
        transports = create_sample_transports(db, harvests)
        preprocessing = create_sample_preprocessing(db, harvests)
        batches = create_sample_manufacturing_batches(db, owner.id)
        distributions = create_sample_distributions(db, batches)
        applications = create_sample_applications(db, distributions)
        audits = create_sample_audits(db, auditor.id, plots, batches)
        
        return {
            "message": "Sample data populated successfully",
            "summary": {
                "plots": len(plots),
                "harvests": len(harvests),
                "batches": len(batches),
                "distributions": len(distributions)
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to populate data: {str(e)}"
        )
