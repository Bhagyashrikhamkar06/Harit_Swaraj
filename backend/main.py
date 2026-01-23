from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List

app = FastAPI(title="Harit Swaraj API")

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

class ManufacturingRecord(BaseModel):
    batch_id: str
    biomass_input: float
    biochar_output: float
    ratio: float
    co2_removed: float
    status: str
    timestamp: datetime

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
    """Record a new biochar production batch"""
    ratio = data.biochar_output / data.biomass_input
    co2 = data.biochar_output * 0.8 * (44 / 12)
    
    # Validation: conversion ratio must be 0.20-0.30
    status = "verified"
    if ratio < 0.20 or ratio > 0.30:
        status = "flagged"
    
    record = {
        "batch_id": data.batch_id,
        "biomass_input": data.biomass_input,
        "biochar_output": data.biochar_output,
        "ratio": round(ratio, 4),
        "co2_removed": round(co2, 2),
        "status": status,
        "kiln_type": data.kiln_type,
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
