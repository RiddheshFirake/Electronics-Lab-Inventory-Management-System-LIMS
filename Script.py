import requests

BASE_URL = "http://localhost:5000/api"
HEADERS = {"Content-Type": "application/json"}
TOKEN = None  # This will be filled after login


def set_auth_token(token):
    global TOKEN
    HEADERS["Authorization"] = f"Bearer {token}"


def print_response(title, response):
    print(f"\n🧪 {title}")
    print("Status Code:", response.status_code)
    try:
        print("Response:", response.json())
    except:
        print("Raw Response:", response.text)


# 1. Auth Routes
def auth_tests():
    print("🔐 Testing Auth Routes")

    # Register (commented if duplicate)
    # r = requests.post(f"{BASE_URL}/auth/register", json={
    #     "name": "Test User",
    #     "email": "test@example.com",
    #     "password": "test1234",
    #     "role": "Admin"
    # }, headers=HEADERS)
    # print_response("Register", r)

    # Login
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test@example.com",
        "password": "test1234"
    }, headers=HEADERS)
    print_response("Login", r)

    if r.status_code == 200:
        token = r.json()["token"]
        set_auth_token(token)


# 2. Component Routes
def component_tests():
    print("\n📦 Testing Component Routes")

    # Create a component
    r = requests.post(f"{BASE_URL}/components", json={
        "componentName": "Resistor 10K",
        "partNumber": "RES-10K-001",
        "category": "Resistors",
        "manufacturer": "ABC",
        "description": "Standard 10K resistor",
        "quantity": 200,
        "unitPrice": 0.05,
        "criticalLowThreshold": 50,
        "location": "Bin A1",
        "status": "Active",
        "tags": ["electronics", "passive"]
    }, headers=HEADERS)
    print_response("Create Component", r)

    component_id = r.json().get("data", {}).get("_id")

    # GET routes
    endpoints = [
        ("Get All Components", "components"),
        ("Low Stock", "components/low-stock"),
        ("Old Stock", "components/old-stock"),
        ("Categories", "components/categories"),
        ("Locations", "components/locations"),
        ("Export", "components/export"),
    ]
    for title, endpoint in endpoints:
        print_response(title, requests.get(f"{BASE_URL}/{endpoint}", headers=HEADERS))

    if component_id:
        # Inward Stock
        r = requests.post(f"{BASE_URL}/components/{component_id}/inward", json={
            "quantity": 50,
            "reasonOrProject": "Restock",
            "notes": "Manual test",
            "batchNumber": "BATCH123",
            "unitCost": 0.05
        }, headers=HEADERS)
        print_response("Inward Stock", r)

        # Outward Stock
        r = requests.post(f"{BASE_URL}/components/{component_id}/outward", json={
            "quantity": 10,
            "reasonOrProject": "Project Alpha",
            "notes": "Issued to engineer"
        }, headers=HEADERS)
        print_response("Outward Stock", r)

        # Transactions
        r = requests.get(f"{BASE_URL}/components/{component_id}/transactions", headers=HEADERS)
        print_response("Component Transactions", r)

        # Delete
        r = requests.delete(f"{BASE_URL}/components/{component_id}", headers=HEADERS)
        print_response("Delete Component", r)


# 3. Dashboard Routes
def dashboard_tests():
    print("\n📊 Testing Dashboard Routes")
    endpoints = [
        ("Overview", "dashboard/overview"),
        ("Monthly Stats", "dashboard/monthly-stats"),
        ("Daily Trends", "dashboard/daily-trends"),
        ("Top Components", "dashboard/top-components"),
        ("Alerts", "dashboard/alerts"),
        ("User Activity", "dashboard/user-activity"),
        ("System Stats", "dashboard/system-stats")
    ]
    for title, endpoint in endpoints:
        print_response(title, requests.get(f"{BASE_URL}/{endpoint}", headers=HEADERS))


# 4. Notification Routes
def notification_tests():
    print("\n🔔 Testing Notification Routes")

    # Get current user notifications
    r = requests.get(f"{BASE_URL}/notifications", headers=HEADERS)
    print_response("Get Notifications", r)

    # Get stats
    r = requests.get(f"{BASE_URL}/notifications/stats", headers=HEADERS)
    print_response("Notification Stats", r)

    # Bulk read mark
    r = requests.put(f"{BASE_URL}/notifications/mark-read-bulk", json={
        "notificationIds": []  # Fill from previous fetch if needed
    }, headers=HEADERS)
    print_response("Mark Notifications as Read", r)


# Run all tests
if __name__ == "__main__":
    auth_tests()
    component_tests()
    dashboard_tests()
    notification_tests()
