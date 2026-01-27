"""
Populate database with sample data for demonstration
"""
from database import SessionLocal, init_db
from models import User, Plot, ManufacturingBatch
from auth import hash_password
from datetime import datetime, timedelta
import random

def populate_sample_data():
    db = SessionLocal()
    
    try:
        # Get existing users
        farmer = db.query(User).filter(User.username == "farmer1").first()
        owner = db.query(User).filter(User.username == "owner1").first()
        
        if not farmer or not owner:
            print("❌ Default users not found. Please start the backend server first.")
            return
        
        # Add sample plots
        sample_plots = [
            {
                "plot_id": "PLOT-001",
                "farmer_id": farmer.id,
                "type": "Wood",
                "species": "Eucalyptus",
                "area": 2.5,
                "expected_biomass": 15.0,
                "status": "verified",
                "verification_data": {"plot_status": "verified", "confidence_score": 0.95}
            },
            {
                "plot_id": "PLOT-002",
                "farmer_id": farmer.id,
                "type": "Agricultural Waste",
                "species": "Rice Husk",
                "area": 1.8,
                "expected_biomass": 10.0,
                "status": "verified",
                "verification_data": {"plot_status": "verified", "confidence_score": 0.92}
            },
            {
                "plot_id": "PLOT-003",
                "farmer_id": farmer.id,
                "type": "Wood",
                "species": "Bamboo",
                "area": 3.2,
                "expected_biomass": 20.0,
                "status": "verified",
                "verification_data": {"plot_status": "verified", "confidence_score": 0.88}
            }
        ]
        
        for plot_data in sample_plots:
            existing = db.query(Plot).filter(Plot.plot_id == plot_data["plot_id"]).first()
            if not existing:
                plot = Plot(**plot_data)
                db.add(plot)
        
        db.commit()
        print(f"✅ Added {len(sample_plots)} sample plots")
        
        # Add sample manufacturing batches
        sample_batches = [
            {
                "batch_id": "BCH-001",
                "biomass_input": 500.0,
                "biochar_output": 125.0,
                "ratio": 0.25,
                "co2_removed": 458.33,
                "kiln_type": "Batch Retort Kiln",
                "species": "Eucalyptus",
                "status": "verified",
                "rule_status": "verified",
                "ml_prediction": {"ml_status": "verified", "confidence_score": 0.95},
                "user_id": owner.id
            },
            {
                "batch_id": "BCH-002",
                "biomass_input": 450.0,
                "biochar_output": 108.0,
                "ratio": 0.24,
                "co2_removed": 396.00,
                "kiln_type": "Continuous Retort",
                "species": "Rice Husk",
                "status": "pending",
                "rule_status": "verified",
                "ml_prediction": {"ml_status": "verified", "confidence_score": 0.88},
                "user_id": owner.id
            },
            {
                "batch_id": "BCH-003",
                "biomass_input": 600.0,
                "biochar_output": 150.0,
                "ratio": 0.25,
                "co2_removed": 550.00,
                "kiln_type": "Batch Retort Kiln",
                "species": "Bamboo",
                "status": "flagged",
                "rule_status": "verified",
                "ml_prediction": {"ml_status": "flagged", "confidence_score": 0.65},
                "user_id": owner.id
            },
            {
                "batch_id": "BCH-004",
                "biomass_input": 550.0,
                "biochar_output": 137.5,
                "ratio": 0.25,
                "co2_removed": 504.17,
                "kiln_type": "TLUD",
                "species": "Mixed Wood",
                "status": "verified",
                "rule_status": "verified",
                "ml_prediction": {"ml_status": "verified", "confidence_score": 0.92},
                "user_id": owner.id
            }
        ]
        
        for batch_data in sample_batches:
            existing = db.query(ManufacturingBatch).filter(
                ManufacturingBatch.batch_id == batch_data["batch_id"]
            ).first()
            if not existing:
                batch = ManufacturingBatch(**batch_data)
                db.add(batch)
        
        db.commit()
        print(f"✅ Added {len(sample_batches)} sample batches")
        print("\n🎉 Sample data populated successfully!")
        print("\nDashboard should now show:")
        print(f"  - Total Biochar: {sum(b['biochar_output'] for b in sample_batches)} kg")
        print(f"  - CO₂ Removed: {sum(b['co2_removed'] for b in sample_batches):.2f} kg")
        print(f"  - Verified Batches: {sum(1 for b in sample_batches if b['status'] == 'verified')}")
        print(f"  - Total Plots: {len(sample_plots)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_sample_data()
