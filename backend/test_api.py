import requests
import json

# Test backend connection
print("Testing Harit Swaraj Backend API...\n")

BASE_URL = "http://127.0.0.1:8000"

# Test 1: Root endpoint
print("1. Testing root endpoint...")
response = requests.get(f"{BASE_URL}/")
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test 2: Register new user
print("2. Testing user registration...")
register_data = {
    "username": "testuser123",
    "email": "testuser@example.com",
    "password": "test123",
    "role": "farmer",
    "full_name": "Test User"
}
response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
print(f"   Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    print(f"   ✅ Registration successful!")
    print(f"   User: {data['user']['username']}")
    print(f"   Role: {data['user']['role']}")
    print(f"   Token: {data['access_token'][:50]}...\n")
    token = data['access_token']
else:
    print(f"   Response: {response.json()}\n")
    token = None

# Test 3: Login with demo account
print("3. Testing login with demo account...")
login_data = {
    "username": "farmer1",
    "password": "farmer123"
}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Login successful!")
    print(f"   User: {data['user']['username']}")
    print(f"   Role: {data['user']['role']}")
    token = data['access_token']
    print(f"   Token: {token[:50]}...\n")
else:
    print(f"   Response: {response.json()}\n")

# Test 4: Get dashboard data (authenticated)
if token:
    print("4. Testing dashboard endpoint (authenticated)...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/dashboard/summary", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Dashboard data retrieved!")
        print(f"   Total Biochar: {data['total_biochar_kg']} kg")
        print(f"   Total CO2 Removed: {data['total_co2_removed_kg']} kg")
        print(f"   Total Batches: {data['total_batches']}")
        print(f"   Total Plots: {data['total_plots']}\n")
    else:
        print(f"   Response: {response.json()}\n")

print("✅ All API tests completed!")
