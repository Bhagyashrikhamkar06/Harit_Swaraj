from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, Plot, BiomassHarvest, ManufacturingBatch, Transport
from auth import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard summary statistics
    """
    # Base queries
    plots_query = db.query(Plot)
    harvests_query = db.query(BiomassHarvest)
    batches_query = db.query(ManufacturingBatch)
    transports_query = db.query(Transport)
    
    # Filter by role
    if current_user.role == 'farmer':
        plots_query = plots_query.filter(Plot.owner_id == current_user.id)
        harvests_query = harvests_query.join(Plot).filter(Plot.owner_id == current_user.id)
        batches_query = batches_query.filter(ManufacturingBatch.user_id == current_user.id)
    elif current_user.role == 'owner':
        plots_query = plots_query.filter(Plot.owner_id == current_user.id)
        harvests_query = harvests_query.join(Plot).filter(Plot.owner_id == current_user.id)
        batches_query = batches_query.filter(ManufacturingBatch.user_id == current_user.id)
    
    # Get counts
    total_plots = plots_query.count()
    total_harvests = harvests_query.count()
    total_batches = batches_query.count()
    total_transports = transports_query.count()
    
    # Get biomass statistics
    total_biomass_expected = db.query(func.sum(Plot.expected_biomass)).scalar() or 0
    total_biomass_harvested = db.query(func.sum(BiomassHarvest.actual_harvested_ton)).scalar() or 0
    total_biochar_produced = db.query(func.sum(ManufacturingBatch.biochar_output)).scalar() or 0
    
    # Calculate CO2 sequestration (rough estimate: 1 ton biochar = 3.67 tons CO2)
    co2_sequestered = float(total_biochar_produced) * 3.67 if total_biochar_produced else 0
    
    # Get verification stats
    verified_plots = plots_query.filter(Plot.status == 'verified').count()
    pending_plots = plots_query.filter(Plot.status == 'pending').count()
    suspicious_plots = plots_query.filter(Plot.status == 'suspicious').count()
    
    return {
        "total_plots": total_plots,
        "total_harvests": total_harvests,
        "total_batches": total_batches,
        "total_transports": total_transports,
        "total_biomass_expected": float(total_biomass_expected),
        "total_biomass_harvested": float(total_biomass_harvested),
        "total_biochar_produced": float(total_biochar_produced),
        "co2_sequestered": round(co2_sequestered, 2),
        "verified_plots": verified_plots,
        "pending_plots": pending_plots,
        "suspicious_plots": suspicious_plots,
        "user_role": current_user.role
    }
