import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock the API response
    page.route("**/api/results", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''{
            "SA": [
                {
                    "_id": "1",
                    "rank": 1,
                    "score": 28.50,
                    "group": { "_id": "g1", "name": "FSG Yverdon", "category": "ACTIFS" },
                    "apparatus": { "code": "SA", "name": "Saut", "icon": "fluent:run-24-filled" },
                    "status": "FINISHED"
                },
                {
                    "_id": "2",
                    "rank": 2,
                    "score": 27.80,
                    "group": { "_id": "g2", "name": "FSG Morges", "category": "ACTIFS" },
                    "apparatus": { "code": "SA", "name": "Saut", "icon": "fluent:run-24-filled" },
                    "status": "FINISHED"
                },
                {
                    "_id": "3",
                    "rank": 3,
                    "score": 27.50,
                    "group": { "_id": "g3", "name": "FSG Lausanne", "category": "ACTIFS" },
                    "apparatus": { "code": "SA", "name": "Saut", "icon": "fluent:run-24-filled" },
                    "status": "FINISHED"
                },
                {
                    "_id": "4",
                    "rank": 4,
                    "score": 26.90,
                    "group": { "_id": "g4", "name": "FSG Aigle", "category": "ACTIFS" },
                    "apparatus": { "code": "SA", "name": "Saut", "icon": "fluent:run-24-filled" },
                    "status": "FINISHED"
                }
            ]
        }'''
    ))

    # Navigate to results page
    # Note: Client-side navigation is better for hydration but direct load works too
    try:
        page.goto("http://localhost:3000/results")
    except Exception as e:
        print(f"Error loading page: {e}")
        # Try to print server logs if failed
        import os
        if os.path.exists("server.log"):
            with open("server.log", "r") as f:
                print(f.read())
        return

    # Wait for the content to appear
    # We look for the group names
    try:
        page.wait_for_selector("text=FSG Yverdon", timeout=10000)
    except:
        print("Timeout waiting for content. Dumping page content.")
        print(page.content())
        page.screenshot(path="verification/timeout.png")
        browser.close()
        return

    # Take a screenshot
    page.screenshot(path="verification/results_verification.png", full_page=True)
    print("Screenshot saved to verification/results_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
