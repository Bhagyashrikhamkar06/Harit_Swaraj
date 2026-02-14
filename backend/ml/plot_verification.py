"""
KML Plot Verification Module
Detects fraudulent land plots using geometry-based ML techniques.

Methods:
1. Area Anomaly Detection (Isolation Forest)
2. Shape Similarity Detection (Hausdorff Distance)
3. Overlap Detection (Shapely Intersection)
4. Spatial Clustering (DBSCAN)
"""

try:
    import numpy as np
    import pickle
    import os
    from datetime import datetime
    from typing import Dict, List, Tuple, Optional
    from shapely.geometry import Polygon, Point
    from shapely.ops import unary_union
    from scipy.spatial.distance import directed_hausdorff
    from sklearn.ensemble import IsolationForest
    from sklearn.cluster import DBSCAN
    import xml.etree.ElementTree as ET
except ImportError as e:
    raise ImportError(f"Missing ML dependency: {e}") from e


class PlotVerifier:
    """ML-based plot verification system for fraud detection"""
    
    def __init__(self):
        self.area_detector = None
        self.existing_plots = []  # In-memory storage (replace with DB in production)
        self.model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(self.model_dir, exist_ok=True)
        
    def load_models(self):
        """Load pre-trained models at startup"""
        model_path = os.path.join(self.model_dir, 'area_detector.pkl')
        
        try:
            with open(model_path, 'rb') as f:
                self.area_detector = pickle.load(f)
            print("[OK] Area detector model loaded")
        except FileNotFoundError:
            print("[WARNING] No existing model found, training initial model...")
            self._train_initial_models()
    
    def _train_initial_models(self):
        """Train initial models with synthetic data"""
        # Generate synthetic area data (0.5 to 10 hectares, normal distribution)
        np.random.seed(42)
        synthetic_areas = np.random.lognormal(mean=1.0, sigma=0.5, size=500)
        synthetic_areas = synthetic_areas.reshape(-1, 1)
        
        # Train Isolation Forest
        self.area_detector = IsolationForest(
            contamination=0.05,  # 5% expected anomalies
            random_state=42,
            n_estimators=100
        )
        self.area_detector.fit(synthetic_areas)
        
        # Save model
        model_path = os.path.join(self.model_dir, 'area_detector.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(self.area_detector, f)
        
        print("[OK] Initial area detector model trained and saved")
    
    def parse_kml(self, kml_content: str) -> Optional[Polygon]:
        """
        Parse KML file and extract polygon
        
        Args:
            kml_content: KML file content as string
            
        Returns:
            Shapely Polygon object or None if parsing fails
        """
        try:
            # Parse XML
            root = ET.fromstring(kml_content)
            
            # Find coordinates (handle different KML namespaces)
            namespaces = {
                'kml': 'http://www.opengis.net/kml/2.2',
                'gx': 'http://www.google.com/kml/ext/2.2'
            }
            
            # Try to find coordinates
            coords_elem = root.find('.//kml:coordinates', namespaces)
            if coords_elem is None:
                coords_elem = root.find('.//coordinates')  # Try without namespace
            
            if coords_elem is None or coords_elem.text is None:
                raise ValueError("No coordinates found in KML")
            
            # Parse coordinates (format: lon,lat,alt lon,lat,alt ...)
            coords_text = coords_elem.text.strip()
            coords = []
            
            for coord_str in coords_text.split():
                parts = coord_str.split(',')
                if len(parts) >= 2:
                    lon, lat = float(parts[0]), float(parts[1])
                    coords.append((lon, lat))
            
            if len(coords) < 3:
                raise ValueError("Polygon must have at least 3 points")
            
            # Create Shapely polygon
            polygon = Polygon(coords)
            
            if not polygon.is_valid:
                # Try to fix invalid polygon
                polygon = polygon.buffer(0)
            
            return polygon
            
        except Exception as e:
            print(f"❌ KML parsing error: {e}")
            return None
    
    def extract_features(self, polygon: Polygon, farmer_id: str = None) -> Dict:
        """
        Extract geometric features from polygon
        
        Args:
            polygon: Shapely Polygon
            farmer_id: Optional farmer ID for historical comparison
            
        Returns:
            Dictionary of features
        """
        # Basic geometry
        area_sq_meters = polygon.area * 111320 * 111320  # Approx conversion from degrees to meters
        area_hectares = area_sq_meters / 10000
        perimeter = polygon.length * 111320  # Approx conversion
        
        # Shape complexity (1.0 = perfect circle, higher = more complex)
        if area_sq_meters > 0:
            shape_complexity = (perimeter ** 2) / (4 * np.pi * area_sq_meters)
        else:
            shape_complexity = 0
        
        # Bounding box
        minx, miny, maxx, maxy = polygon.bounds
        bbox_width = (maxx - minx) * 111320
        bbox_height = (maxy - miny) * 111320
        
        if bbox_height > 0:
            aspect_ratio = bbox_width / bbox_height
        else:
            aspect_ratio = 1.0
        
        # Convexity (how close to convex hull)
        convex_hull = polygon.convex_hull
        convexity = polygon.area / convex_hull.area if convex_hull.area > 0 else 1.0
        
        # Centroid
        centroid = polygon.centroid
        
        features = {
            'area_hectares': area_hectares,
            'area_sq_meters': area_sq_meters,
            'perimeter_meters': perimeter,
            'num_vertices': len(polygon.exterior.coords),
            'shape_complexity': shape_complexity,
            'aspect_ratio': aspect_ratio,
            'convexity': convexity,
            'centroid_lat': centroid.y,
            'centroid_lon': centroid.x,
            'bbox_width': bbox_width,
            'bbox_height': bbox_height
        }
        
        return features
    
    def check_area_anomaly(self, area_hectares: float) -> Dict:
        """
        Check if plot area is anomalous
        
        Args:
            area_hectares: Plot area in hectares
            
        Returns:
            Detection result dictionary
        """
        if self.area_detector is None:
            return {'is_anomaly': False, 'reason': 'Model not loaded'}
        
        area_array = np.array([[area_hectares]])
        
        # Predict (-1 = anomaly, 1 = normal)
        prediction = self.area_detector.predict(area_array)[0]
        anomaly_score = self.area_detector.score_samples(area_array)[0]
        
        is_anomaly = (prediction == -1)
        
        # Determine reason
        reason = ""
        if is_anomaly:
            if area_hectares > 10:
                reason = f"Unusually large plot: {area_hectares:.2f} ha"
            elif area_hectares < 0.1:
                reason = f"Unusually small plot: {area_hectares:.2f} ha"
            else:
                reason = f"Atypical plot size: {area_hectares:.2f} ha"
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': float(anomaly_score),
            'area_hectares': area_hectares,
            'reason': reason
        }
    
    def check_shape_similarity(self, polygon: Polygon, threshold: float = 0.95) -> Dict:
        """
        Check if plot shape is similar to existing plots
        
        Args:
            polygon: New polygon to check
            threshold: Similarity threshold (0-1)
            
        Returns:
            Detection result dictionary
        """
        similar_plots = []
        max_similarity = 0.0
        
        for existing in self.existing_plots:
            similarity = self._calculate_shape_similarity(polygon, existing['polygon'])
            
            if similarity > max_similarity:
                max_similarity = similarity
            
            if similarity > threshold:
                similar_plots.append({
                    'plot_id': existing['plot_id'],
                    'similarity': float(similarity),
                    'farmer_id': existing.get('farmer_id', 'unknown')
                })
        
        return {
            'similar_plots': similar_plots,
            'max_similarity': float(max_similarity),
            'is_suspicious': len(similar_plots) > 0
        }
    
    def _calculate_shape_similarity(self, poly1: Polygon, poly2: Polygon) -> float:
        """
        Calculate shape similarity using Hausdorff distance
        
        Args:
            poly1, poly2: Polygons to compare
            
        Returns:
            Similarity score (0-1, 1 = identical)
        """
        try:
            # Normalize polygons (remove translation and scale)
            coords1 = np.array(poly1.exterior.coords[:-1])  # Remove duplicate last point
            coords2 = np.array(poly2.exterior.coords[:-1])
            
            # Normalize to unit square
            coords1_norm = self._normalize_coords(coords1)
            coords2_norm = self._normalize_coords(coords2)
            
            # Calculate Hausdorff distance
            dist_forward = directed_hausdorff(coords1_norm, coords2_norm)[0]
            dist_backward = directed_hausdorff(coords2_norm, coords1_norm)[0]
            hausdorff_dist = max(dist_forward, dist_backward)
            
            # Convert to similarity (0-1 scale)
            similarity = 1 / (1 + hausdorff_dist)
            
            return similarity
            
        except Exception as e:
            print(f"⚠️ Shape similarity calculation error: {e}")
            return 0.0
    
    def _normalize_coords(self, coords: np.ndarray) -> np.ndarray:
        """Normalize coordinates to unit square"""
        if len(coords) == 0:
            return coords
        
        # Center at origin
        coords_centered = coords - coords.mean(axis=0)
        
        # Scale to unit square
        max_range = np.abs(coords_centered).max()
        if max_range > 0:
            coords_normalized = coords_centered / max_range
        else:
            coords_normalized = coords_centered
        
        return coords_normalized
    
    def check_overlaps(self, polygon: Polygon, min_overlap_pct: float = 5.0) -> Dict:
        """
        Check if plot overlaps with existing plots
        
        Args:
            polygon: New polygon to check
            min_overlap_pct: Minimum overlap percentage to flag
            
        Returns:
            Detection result dictionary
        """
        overlaps = []
        max_overlap = 0.0
        
        for existing in self.existing_plots:
            if polygon.intersects(existing['polygon']):
                intersection = polygon.intersection(existing['polygon'])
                overlap_pct = (intersection.area / polygon.area) * 100
                
                if overlap_pct > max_overlap:
                    max_overlap = overlap_pct
                
                if overlap_pct > min_overlap_pct:
                    overlaps.append({
                        'plot_id': existing['plot_id'],
                        'overlap_percentage': float(overlap_pct),
                        'farmer_id': existing.get('farmer_id', 'unknown')
                    })
        
        return {
            'overlaps': overlaps,
            'max_overlap': float(max_overlap),
            'is_suspicious': len(overlaps) > 0
        }
    
    def check_spatial_clustering(self, polygon: Polygon, farmer_id: str) -> Dict:
        """
        Check for suspicious geographic clustering
        
        Args:
            polygon: New polygon
            farmer_id: Farmer ID
            
        Returns:
            Detection result dictionary
        """
        # Get farmer's existing plots
        farmer_plots = [p for p in self.existing_plots if p.get('farmer_id') == farmer_id]
        
        if len(farmer_plots) < 5:
            return {
                'is_suspicious': False,
                'cluster_count': len(farmer_plots),
                'reason': ''
            }
        
        # Get centroids
        centroids = [(p['polygon'].centroid.y, p['polygon'].centroid.x) for p in farmer_plots]
        centroids.append((polygon.centroid.y, polygon.centroid.x))
        centroids_array = np.array(centroids)
        
        # DBSCAN clustering (eps ~1km in degrees)
        clustering = DBSCAN(eps=0.01, min_samples=5).fit(centroids_array)
        
        # Check if too many plots in same cluster
        labels = clustering.labels_
        if labels[-1] != -1:  # New plot is in a cluster
            cluster_size = np.sum(labels == labels[-1])
            if cluster_size > 10:
                return {
                    'is_suspicious': True,
                    'cluster_count': int(cluster_size),
                    'reason': f'{cluster_size} plots within 1km radius'
                }
        
        return {
            'is_suspicious': False,
            'cluster_count': len(farmer_plots) + 1,
            'reason': ''
        }
    
    def verify_plot(self, kml_content: str, farmer_id: str, plot_id: str) -> Dict:
        """
        Main verification function
        
        Args:
            kml_content: KML file content
            farmer_id: Farmer ID
            plot_id: Plot ID
            
        Returns:
            Verification report
        """
        # Parse KML
        polygon = self.parse_kml(kml_content)
        if polygon is None:
            return {
                'plot_status': 'error',
                'confidence_score': 0.0,
                'anomaly_reasons': ['Invalid KML file'],
                'error': 'Failed to parse KML'
            }
        
        # Extract features
        features = self.extract_features(polygon, farmer_id)
        
        # Run all detection methods
        area_check = self.check_area_anomaly(features['area_hectares'])
        shape_check = self.check_shape_similarity(polygon)
        overlap_check = self.check_overlaps(polygon)
        cluster_check = self.check_spatial_clustering(polygon, farmer_id)
        
        # Generate report
        report = self._generate_report(
            plot_id, farmer_id, features, 
            area_check, shape_check, overlap_check, cluster_check
        )
        
        # Store plot for future comparisons (in production, save to database)
        self.existing_plots.append({
            'plot_id': plot_id,
            'farmer_id': farmer_id,
            'polygon': polygon,
            'features': features,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return report
    
    def _generate_report(self, plot_id: str, farmer_id: str, features: Dict,
                        area_check: Dict, shape_check: Dict, 
                        overlap_check: Dict, cluster_check: Dict) -> Dict:
        """Generate human-readable verification report"""
        
        suspicious = False
        reasons = []
        confidence = 1.0
        
        # Area anomaly
        if area_check['is_anomaly']:
            suspicious = True
            reasons.append(area_check['reason'])
            confidence *= 0.7
        
        # Shape similarity
        if shape_check['is_suspicious']:
            suspicious = True
            similar_ids = [p['plot_id'] for p in shape_check['similar_plots']]
            reasons.append(f"Similar to existing plot(s): {', '.join(similar_ids[:3])}")
            confidence *= 0.6
        
        # Overlaps
        if overlap_check['is_suspicious']:
            suspicious = True
            overlap_count = len(overlap_check['overlaps'])
            reasons.append(f"Overlaps with {overlap_count} existing plot(s)")
            confidence *= 0.5
        
        # Clustering
        if cluster_check['is_suspicious']:
            suspicious = True
            reasons.append(cluster_check['reason'])
            confidence *= 0.8
        
        return {
            'plot_id': plot_id,
            'farmer_id': farmer_id,
            'plot_status': 'suspicious' if suspicious else 'verified',
            'confidence_score': round(confidence, 2),
            'anomaly_reasons': reasons,
            'overlap_percentage': overlap_check['max_overlap'],
            'similar_plot_ids': [p['plot_id'] for p in shape_check['similar_plots']],
            'timestamp': datetime.utcnow().isoformat(),
            'features': {
                'area_hectares': round(features['area_hectares'], 2),
                'perimeter_meters': round(features['perimeter_meters'], 2),
                'shape_complexity': round(features['shape_complexity'], 2),
                'num_vertices': features['num_vertices']
            },
            'details': {
                'area_check': area_check,
                'shape_check': {
                    'max_similarity': shape_check['max_similarity'],
                    'similar_plots': shape_check['similar_plots']
                },
                'overlap_check': overlap_check,
                'cluster_check': cluster_check
            }
        }


# Singleton instance
_verifier = None

def get_plot_verifier() -> PlotVerifier:
    """Get singleton plot verifier instance"""
    global _verifier
    if _verifier is None:
        _verifier = PlotVerifier()
        _verifier.load_models()
    return _verifier
