import requests
import time
import sys

def seed():
    url = "http://localhost:3000/api/admin/seed"
    headers = {
        "Authorization": "Bearer secret"
    }

    print(f"Calling {url}...")
    try:
        response = requests.post(url, headers=headers)
        if response.status_code == 200:
            print("Seed successful!")
            print(response.json())
        else:
            print(f"Seed failed: {response.status_code}")
            print(response.text)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Wait for server to be ready
    for i in range(30):
        try:
            requests.get("http://localhost:3000")
            break
        except:
            print("Waiting for server...")
            time.sleep(2)

    seed()
