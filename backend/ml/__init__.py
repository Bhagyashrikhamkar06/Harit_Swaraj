try:
    from .manufacturing_anomaly import ManufacturingAnomalyDetector, get_anomaly_detector
except ImportError:
    # If dependencies are missing, these will be mocked by main.py
    # This prevents the app from crashing when inspecting the 'ml' package
    pass

__all__ = ["ManufacturingAnomalyDetector", "get_anomaly_detector"]
