from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Harit Swaraj API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Harit Swaraj backend running"}

@app.get("/biochar/summary")
def biochar_summary():
    return {
        "biomass_tons": 30,
        "biochar_tons": 9,
        "co2_removed": 26.4
    }
