import requests
import json
import os
import random

BASE_URL = "http://localhost:8000"
USERNAME = "owner1"
PASSWORD = "owner123"

def login():
    print("[1/5] Logging in...")
    response = requests.post(f"{BASE_URL}/auth/login", json={"username": USERNAME, "password": PASSWORD})
    if response.status_code == 200:
        print("Login successful")
        return response.json()['access_token']
    else:
        print(f"Login failed: {response.text}")
        exit(1)

def create_dummy_kml(filename):
    print("[2/5] Creating test KML file...")
    content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Plot</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              77.5,28.5,0
              77.6,28.5,0
              77.6,28.6,0
              77.5,28.6,0
              77.5,28.5,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>"""
    with open(filename, "w") as f:
        f.write(content)
    print("Test KML file created")
    return filename

def create_plot(token, kml_path):
    print("[3/5] Creating new biomass plot...")
    plot_id = f"TEST_PLOT_{random.randint(1000, 9999)}"
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(kml_path, 'rb') as f:
        files = {
            'kml_file': ('test_plot.kml', f, 'application/vnd.google-earth.kml+xml')
        }
        data = {
            'plot_id': plot_id,
            'type': 'Wood',
            'species': 'Eucalyptus',
            'area': '5.5',
            'expected_biomass': '25.0'
        }
        
        response = requests.post(f"{BASE_URL}/biomass/register-plot", headers=headers, data=data, files=files)
    
    if response.status_code == 201:
        result = response.json()
        print(f"Plot created successfully! ID: {result['plot_id']}, Status: {result['status']}")
        return plot_id
    else:
        print(f"Failed to create plot: {response.text}")
        exit(1)

def read_plots(token, plot_id_str):
    print("[4/5] Reading all plots...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/biomass/plots", headers=headers)
    
    if response.status_code == 200:
        plots = response.json()
        print(f"Found {len(plots)} plot(s)")
        target_plot = next((p for p in plots if p['plot_id'] == plot_id_str), None)
        
        if target_plot:
            print(f"  Target Plot Found: ID={target_plot['id']}, PlotID={target_plot['plot_id']}")
            return target_plot['id']
        else:
            print(f"  Target plot {plot_id_str} not found in list")
            exit(1)
    else:
        print(f"Failed to read plots: {response.text}")
        exit(1)

def delete_plot(token, db_id):
    print("[5/5] Deleting test plot...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/biomass/plots/{db_id}", headers=headers)
    
    if response.status_code == 200:
        print("Plot deleted successfully!")
    else:
        print(f"Failed to delete plot: {response.text}")

def main():
    print("=== Harit Swaraj CRUD Test (Python) ===")
    token = login()
    kml_file = create_dummy_kml("test_plot_py.kml")
    
    try:
        plot_id_str = create_plot(token, kml_file)
        db_id = read_plots(token, plot_id_str)
        delete_plot(token, db_id)
        
        print("\n=== CRUD Test Complete ===")
        print("  CREATE - Plot registered")
        print("  READ   - Plot retrieved")
        print("  DELETE - Plot removed")
        
    finally:
        if os.path.exists(kml_file):
            os.remove(kml_file)
            print("Cleanup: Test file removed")

if __name__ == "__main__":
    main()
