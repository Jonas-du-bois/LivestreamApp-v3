import requests
import json

BASE_URL = "http://localhost:3000/api"

def seed_db():
    print("Logging in...")
    try:
        resp = requests.post(f"{BASE_URL}/admin/login", json={"password": "admin"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return False

        token = resp.json().get("token")
        print(f"Logged in. Token: {token[:10]}...")

        print("Seeding DB...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{BASE_URL}/admin/seed", headers=headers)

        if resp.status_code != 200:
            print(f"Seed failed: {resp.status_code} {resp.text}")
            return False

        print("Seed success:", resp.json())
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    seed_db()
