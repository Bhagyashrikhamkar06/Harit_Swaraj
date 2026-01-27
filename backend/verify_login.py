
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def check_backend_health():
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print(f"✅ Backend is running: {response.json()}")
            return True
        else:
            print(f"⚠️ Backend returned unexpected status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend at http://127.0.0.1:8000")
        print("   -> Is the backend server running?")
        print("   -> Try running: uvicorn backend.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return False

def verify_login(username, password):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "username": username,
        "password": password
    }
    
    print(f"\nAttempting login for user: {username}...")
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print(f"✅ Login SUCCESS! Token received.")
                print(f"   Role: {data['user']['role']}")
                return True
            else:
                print("⚠️ Login successful but no token received?")
                return False
        elif response.status_code == 401:
            print(f"❌ Login FAILED: invalid credentials for {username}")
            return False
        else:
            print(f"❌ Login FAILED with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during login request: {e}")
        return False

if __name__ == "__main__":
    print("--- Harit Swaraj Backend Verification ---\n")
    if check_backend_health():
        # Try default users based on main.py startup event
        verify_login("farmer1", "farmer123")
        verify_login("owner1", "owner123")
