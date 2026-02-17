"""
Script to populate the database with realistic sample data for demonstration
"""
from datetime import datetime, timedelta
import random
from database import SessionLocal, init_db
from models import (User, Plot, PlotPhoto, BiomassHarvest, Transport, 
                    BiomassPreprocessing, ManufacturingBatch, Distribution, 
                    UnburnableProcess, BiocharApplication, Audit)
from auth import hash_password

def clear_existing_data(db):
    """Clear all existing data except users"""
    print("Clearing existing data (keeping users)...")
    db.query(Audit).delete()
    db.query(BiocharApplication).delete()
    db.query(UnburnableProcess).delete()
    db.query(Distribution).delete()
    db.query(ManufacturingBatch).delete()
    db.query(BiomassPreprocessing).delete()
    db.query(Transport).delete()
    db.query(BiomassHarvest).delete()
    db.query(PlotPhoto).delete()
    db.query(Plot).delete()
    db.commit()
    print("✅ Cleared existing data")

def create_sample_plots(db, farmer_id):
    """Create sample biomass plots"""
    print("\nCreating sample plots...")
    plots = [
        Plot(
            plot_id="PLOT-2024-001",
            owner_id=farmer_id,
            type="Wood",
            species="Eucalyptus",
            area=5.5,
            expected_biomass=12.5,
            status="verified",
            verification_data={"verified_by": "admin", "verified_at": "2024-01-15"},
            created_at=datetime.now() - timedelta(days=90)
        ),
        Plot(
            plot_id="PLOT-2024-002",
            owner_id=farmer_id,
            type="Agricultural Waste",
            species="Rice Straw",
            area=3.2,
            expected_biomass=8.0,
            status="verified",
            verification_data={"verified_by": "admin", "verified_at": "2024-01-20"},
            created_at=datetime.now() - timedelta(days=85)
        ),
        Plot(
            plot_id="PLOT-2024-003",
            owner_id=farmer_id,
            type="Wood",
            species="Bamboo",
            area=4.0,
            expected_biomass=10.0,
            status="verified",
            verification_data={"verified_by": "admin", "verified_at": "2024-02-01"},
            created_at=datetime.now() - timedelta(days=75)
        ),
    ]
    
    for plot in plots:
        db.add(plot)
    db.commit()
    print(f"✅ Created {len(plots)} sample plots")
    return plots

def create_sample_harvests(db, plots, farmer_id):
    """Create sample biomass harvests"""
    print("\nCreating sample harvests...")
    harvests = []
    
    for i, plot in enumerate(plots[:2]):  # Only first 2 plots harvested
        harvest = BiomassHarvest(
            biomass_batch_id=f"BMB-2024-{str(i+1).zfill(3)}",
            plot_id=plot.id,
            actual_harvested_ton=plot.expected_biomass * random.uniform(0.85, 1.05),
            user_id=farmer_id,
            created_at=datetime.now() - timedelta(days=60 - i*10)
        )
        harvests.append(harvest)
        db.add(harvest)
    
    db.commit()
    print(f"✅ Created {len(harvests)} sample harvests")
    return harvests

def create_sample_transports(db, harvests):
    """Create sample transport records"""
    print("\nCreating sample transports...")
    transports = []
    
    for i, harvest in enumerate(harvests):
        transport = Transport(
            shipment_id=f"SHIP-IN-{str(i+1).zfill(3)}",
            type="inbound",
            harvest_id=harvest.id,
            vehicle_type="Truck",
            vehicle_number=f"MH12AB{1234+i}",
            mileage=random.uniform(50, 150),
            route_from="Farm Location",
            route_to="Biochar Facility",
            date=datetime.now() - timedelta(days=55 - i*10)
        )
        transports.append(transport)
        db.add(transport)
    
    db.commit()
    print(f"✅ Created {len(transports)} sample transports")
    return transports

def create_sample_preprocessing(db, harvests):
    """Create sample preprocessing records"""
    print("\nCreating sample preprocessing...")
    preprocessing_records = []
    
    for i, harvest in enumerate(harvests):
        preprocessing = BiomassPreprocessing(
            harvest_id=harvest.id,
            method="Chipping and Drying",
            created_at=datetime.now() - timedelta(days=50 - i*10)
        )
        preprocessing_records.append(preprocessing)
        db.add(preprocessing)
    
    db.commit()
    print(f"✅ Created {len(preprocessing_records)} preprocessing records")
    return preprocessing_records

def create_sample_manufacturing_batches(db, owner_id):
    """Create sample manufacturing batches"""
    print("\nCreating sample manufacturing batches...")
    batches = []
    
    batch_configs = [
        {
            "batch_id": "BCH-2024-001",
            "biomass_input": 1000.0,
            "biochar_output": 250.0,
            "kiln_type": "Batch Retort Kiln",
            "species": "Eucalyptus",
            "status": "verified",
            "rule_status": "verified",
            "days_ago": 45
        },
        {
            "batch_id": "BCH-2024-002",
            "biomass_input": 1500.0,
            "biochar_output": 375.0,
            "kiln_type": "Batch Retort Kiln",
            "species": "Rice Straw",
            "status": "verified",
            "rule_status": "verified",
            "days_ago": 35
        },
        {
            "batch_id": "BCH-2024-003",
            "biomass_input": 800.0,
            "biochar_output": 200.0,
            "kiln_type": "Batch Retort Kiln",
            "species": "Bamboo",
            "status": "verified",
            "rule_status": "verified",
            "days_ago": 25
        },
        {
            "batch_id": "BCH-2024-004",
            "biomass_input": 1200.0,
            "biochar_output": 300.0,
            "kiln_type": "Batch Retort Kiln",
            "species": "Mixed Wood",
            "status": "verified",
            "rule_status": "verified",
            "days_ago": 15
        },
        {
            "batch_id": "BCH-2024-005",
            "biomass_input": 2000.0,
            "biochar_output": 500.0,
            "kiln_type": "Batch Retort Kiln",
            "species": "Eucalyptus",
            "status": "verified",
            "rule_status": "verified",
            "days_ago": 5
        },
    ]
    
    for config in batch_configs:
        ratio = config["biochar_output"] / config["biomass_input"]
        co2_removed = config["biochar_output"] * 3.67  # Standard conversion
        
        batch = ManufacturingBatch(
            batch_id=config["batch_id"],
            biomass_input=config["biomass_input"],
            biochar_output=config["biochar_output"],
            ratio=ratio,
            co2_removed=co2_removed,
            kiln_type=config["kiln_type"],
            species=config["species"],
            status=config["status"],
            rule_status=config["rule_status"],
            ml_prediction={
                "ml_status": "verified",
                "confidence_score": random.uniform(0.85, 0.98),
                "conversion_ratio": ratio,
                "reason": f"Ratio within normal range ({ratio*100:.2f}%)"
            },
            blockchain_status="confirmed",
            blockchain_tx_hash=f"0x{''.join(random.choices('0123456789abcdef', k=64))}",
            certificate_token_id=1000 + len(batches),
            user_id=owner_id,
            created_at=datetime.now() - timedelta(days=config["days_ago"])
        )
        batches.append(batch)
        db.add(batch)
    
    db.commit()
    print(f"✅ Created {len(batches)} manufacturing batches")
    return batches

def create_sample_distributions(db, batches):
    """Create sample distributions"""
    print("\nCreating sample distributions...")
    distributions = []
    
    customers = [
        {"id": "CUST-001", "use": "Agriculture", "location": "Maharashtra"},
        {"id": "CUST-002", "use": "Horticulture", "location": "Karnataka"},
        {"id": "CUST-003", "use": "Agriculture", "location": "Tamil Nadu"},
        {"id": "CUST-004", "use": "Soil Amendment", "location": "Gujarat"},
    ]
    
    for i, batch in enumerate(batches[:4]):  # Distribute first 4 batches
        customer = customers[i % len(customers)]
        quantity = batch.biochar_output * random.uniform(0.6, 0.9)
        
        distribution = Distribution(
            batch_id=batch.id,
            customer_id=customer["id"],
            planned_use=customer["use"],
            location=customer["location"],
            quantity_kg=quantity,
            amount_rs=quantity * random.uniform(15, 25),  # Rs 15-25 per kg
            created_at=batch.created_at + timedelta(days=random.randint(3, 10))
        )
        distributions.append(distribution)
        db.add(distribution)
    
    db.commit()
    print(f"✅ Created {len(distributions)} distributions")
    return distributions

def create_sample_applications(db, distributions):
    """Create sample biochar applications"""
    print("\nCreating sample applications...")
    applications = []
    
    for i, dist in enumerate(distributions[:3]):  # Apply first 3 distributions
        application = BiocharApplication(
            distribution_id=dist.id,
            purpose=dist.planned_use,
            created_at=dist.created_at + timedelta(days=random.randint(2, 7))
        )
        applications.append(application)
        db.add(application)
    
    db.commit()
    print(f"✅ Created {len(applications)} applications")
    return applications

def create_sample_audits(db, auditor_id, plots, batches):
    """Create sample audit records"""
    print("\nCreating sample audits...")
    audits = []
    
    # Field audit
    field_audit = Audit(
        type="field",
        auditor_id=auditor_id,
        plot_id=plots[0].id,
        satellite_land_use="Agricultural Land",
        observed_land_use="Agricultural Land",
        photos=["audit_field_1.jpg", "audit_field_2.jpg"],
        date=datetime.now() - timedelta(days=30)
    )
    audits.append(field_audit)
    db.add(field_audit)
    
    # Manufacturing audit
    mfg_audit = Audit(
        type="manufacturing",
        auditor_id=auditor_id,
        facility_location_check=True,
        inbound_biomass_data={"verified_quantity": 1000, "documented_quantity": 1000},
        actual_biomass_data={"measured_quantity": 980},
        biochar_production_data={"verified_output": 245, "documented_output": 250},
        photos=["audit_mfg_1.jpg", "audit_mfg_2.jpg"],
        date=datetime.now() - timedelta(days=20)
    )
    audits.append(mfg_audit)
    db.add(mfg_audit)
    
    db.commit()
    print(f"✅ Created {len(audits)} audit records")
    return audits

def main():
    """Main function to populate sample data"""
    print("=" * 60)
    print("POPULATING HARIT SWARAJ DATABASE WITH SAMPLE DATA")
    print("=" * 60)
    
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Get user IDs
        farmer = db.query(User).filter(User.username == "farmer1").first()
        owner = db.query(User).filter(User.username == "owner1").first()
        auditor = db.query(User).filter(User.username == "auditor1").first()
        
        if not all([farmer, owner, auditor]):
            print("❌ Default users not found. Please run the backend first.")
            return
        
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
        
        print("\n" + "=" * 60)
        print("✅ SAMPLE DATA POPULATION COMPLETE!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Plots: {len(plots)}")
        print(f"  - Harvests: {len(harvests)}")
        print(f"  - Transports: {len(transports)}")
        print(f"  - Preprocessing: {len(preprocessing)}")
        print(f"  - Manufacturing Batches: {len(batches)}")
        print(f"  - Distributions: {len(distributions)}")
        print(f"  - Applications: {len(applications)}")
        print(f"  - Audits: {len(audits)}")
        print(f"\nTotal Biochar Produced: {sum(b.biochar_output for b in batches):.2f} kg")
        print(f"Total CO₂ Removed: {sum(b.co2_removed for b in batches):.2f} kg")
        print("\n🎉 You can now refresh the dashboard to see the data!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
