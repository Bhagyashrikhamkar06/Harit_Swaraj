
"""
Mock ML models for environments where scikit-learn is not installed.
"""
from datetime import datetime

class MockManufacturingAnomalyDetector:
    def predict(self, biomass_input: float, biochar_output: float, kiln_type: str) -> dict:
        ratio = biochar_output / biomass_input if biomass_input > 0 else 0
        return {
            "ml_status": "verified",
            "confidence_score": 0.0,
            "anomaly_score": 0.0,
            "conversion_ratio": round(ratio, 4),
            "reason": "ML (Mock) verified",
            "timestamp": datetime.utcnow().isoformat()
        }

class MockPlotVerifier:
    def verify_plot(self, kml_string, user_id, plot_id):
        return {
            "plot_status": "verified",
            "confidence_score": 1.0,
            "anomaly_reasons": [],
            "timestamp": datetime.utcnow().isoformat()
        }

_anomaly_detector = MockManufacturingAnomalyDetector()
_plot_verifier = MockPlotVerifier()

def get_anomaly_detector():
    return _anomaly_detector

def get_plot_verifier():
    return _plot_verifier
