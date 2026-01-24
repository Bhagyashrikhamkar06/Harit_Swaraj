from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from ml.manufacturing_anomaly import get_anomaly_detector
from ml.plot_verification import get_plot_verifier

app = FastAPI(title="Harit Swaraj API")

# Initialize ML models at startup
anomaly_detector = get_anomaly_detector()
plot_verifier = get_plot_verifier()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ MODELS ============
class ManufacturingInput(BaseModel):
    batch_id: str
    biomass_input: float
    biochar_output: float
    kiln_type: str
    species: Optional[str] = None

class MLPrediction(BaseModel):
    ml_status: str  # "verified" | "flagged"
    confidence_score: float  # 0-1
    anomaly_score: float
    conversion_ratio: float
    reason: str
    timestamp: str

class ManufacturingRecord(BaseModel):
    batch_id: str
    biomass_input: float
    biochar_output: float
    ratio: float
    co2_removed: float
    status: str  # Rule-based status
    ml_prediction: Optional[MLPrediction] = None  # ML-based prediction
    timestamp: datetime
    kiln_type: str

# ============ STORAGE ============
manufacturing_records = []

# ============ EXISTING ENDPOINTS ============
@app.get("/")
def root():
    return {"message": "Harit Swaraj backend running"}

@app.get("/biochar/summary")
def biochar_summary():
    if not manufacturing_records:
        return {
            "biomass_tons": 0,
            "biochar_tons": 0,
            "co2_removed": 0
        }
    
    total_biomass = sum(r["biomass_input"] for r in manufacturing_records)
    total_biochar = sum(r["biochar_output"] for r in manufacturing_records)
    total_co2 = sum(r["co2_removed"] for r in manufacturing_records)
    
    return {
        "biomass_tons": total_biomass,
        "biochar_tons": total_biochar,
        "co2_removed": round(total_co2, 2)
    }

class BiocharInput(BaseModel):
    biomass_tons: float
    biochar_tons: float

@app.post("/biochar/calculate")
def calculate_biochar(data: BiocharInput):
    if data.biomass_tons <= 0:
        return {"error": "Biomass must be greater than 0"}

    ratio = data.biochar_tons / data.biomass_tons
    co2_removed = data.biochar_tons * 0.8 * (44 / 12)

    risk = "Normal"
    if ratio > 0.5:
        risk = "Suspicious – needs audit"

    return {
        "co2_removed": round(co2_removed, 2),
        "yield_ratio": round(ratio, 2),
        "risk": risk
    }

# ============ MANUFACTURING ENDPOINTS ============
@app.post("/manufacturing/record")
def record_manufacturing(data: ManufacturingInput):
    """
    Record a new biochar production batch with ML anomaly detection.
    
    Hybrid approach:
    1. Rule-based: Validate against known standards (0.20-0.30 ratio)
    2. ML-based: Isolation Forest detects unknown anomalies
    
    Returns both statuses for comprehensive audit trail.
    """
    ratio = data.biochar_output / data.biomass_input
    co2 = data.biochar_output * 0.8 * (44 / 12)
    
    # Rule-based validation: conversion ratio must be 0.20-0.30
    rule_status = "verified"
    if ratio < 0.20 or ratio > 0.30:
        rule_status = "flagged"
    
    # ML-based anomaly detection
    try:
        ml_prediction = anomaly_detector.predict(
            biomass_input=data.biomass_input,
            biochar_output=data.biochar_output,
            kiln_type=data.kiln_type
        )
    except Exception as e:
        print(f"⚠️  ML prediction error: {e}")
        ml_prediction = {
            "ml_status": "error",
            "confidence_score": 0.0,
            "anomaly_score": 0.0,
            "conversion_ratio": ratio,
            "reason": "ML service temporarily unavailable",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Final status: combine both approaches
    # If either rule or ML flags it, mark as flagged
    final_status = "flagged" if (rule_status == "flagged" or ml_prediction.get("ml_status") == "flagged") else "verified"
    
    record = {
        "batch_id": data.batch_id,
        "biomass_input": data.biomass_input,
        "biochar_output": data.biochar_output,
        "ratio": round(ratio, 4),
        "co2_removed": round(co2, 2),
        "status": final_status,  # Final combined status
        "rule_status": rule_status,  # Rule-based only
        "ml_prediction": ml_prediction,  # ML prediction details
        "kiln_type": data.kiln_type,
        "species": data.species,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    manufacturing_records.append(record)
    return record

@app.get("/manufacturing/history")
def get_manufacturing_history() -> List[dict]:
    """Get all manufacturing records"""
    return manufacturing_records

@app.get("/manufacturing/batches")
def get_batches():
    """Get all batches in dashboard format"""
    return [
        {
            "id": r["batch_id"],
            "biomass": r["biomass_input"],
            "biochar": r["biochar_output"],
            "ratio": r["ratio"],
            "co2": r["co2_removed"],
            "status": r["status"]
        }
        for r in manufacturing_records
    ]

# ============ PLOT VERIFICATION ENDPOINT ============
@app.post("/biomass/verify-plot")
async def verify_plot(
    kml_file: UploadFile = File(...),
    farmer_id: str = Form(...),
    plot_id: str = Form(...)
):
    """
    Verify KML plot for fraud detection using ML
    
    Detection methods:
    1. Area anomaly detection (Isolation Forest)
    2. Shape similarity detection (Hausdorff distance)
    3. Overlap detection (Shapely intersection)
    4. Spatial clustering (DBSCAN)
    
    Returns:
    - plot_status: "verified" | "suspicious"
    - confidence_score: 0-1
    - anomaly_reasons: List of human-readable warnings
    - overlap_percentage: % overlap with existing plots
    - similar_plot_ids: IDs of similar plots
    """
    try:
        # Read KML file content
        kml_content = await kml_file.read()
        kml_string = kml_content.decode('utf-8')
        
        # Run ML verification
        result = plot_verifier.verify_plot(kml_string, farmer_id, plot_id)
        
        return result
        
    except Exception as e:
        return {
            "plot_status": "error",
            "confidence_score": 0.0,
            "anomaly_reasons": [f"Verification error: {str(e)}"],
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
