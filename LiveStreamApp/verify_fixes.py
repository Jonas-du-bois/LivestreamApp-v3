from playwright.sync_api import sync_playwright, expect

def run(page):
    # Mock /api/live
    page.route("**/api/live", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"passages": [{"_id": "p1", "group": {"_id": "g1", "name": "FSG Mock"}, "apparatus": {"_id": "a1", "name": "Barres", "code": "BA", "icon": "fluent:circle-24-regular"}, "location": "Salle 1", "startTime": "2025-01-01T10:00:00Z", "status": "LIVE"}], "streams": []}'
    ))

    # Mock /api/weather
    page.route("**/api/weather", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"temperature": 20}'
    ))

    # Mock /api/schedule
    page.route("**/api/schedule**", lambda route: route.fulfill(
         status=200,
         content_type="application/json",
         body='{"meta": {"availableApparatus": ["Barres"], "availableDays": ["samedi"]}, "data": [{"_id": "p1", "group": {"_id": "g1", "name": "FSG Mock"}, "apparatus": {"_id": "a1", "name": "Barres", "code": "BA", "name": "Barres"}, "startTime": "2025-01-01T10:00:00Z"}]}'
    ))

    # Mock /api/groups/g1/details
    page.route("**/api/groups/g1/details", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''{
            "info": {"_id": "g1", "name": "FSG Mock", "canton": "VD", "category": "ACTIVE"},
            "stats": {"completedPassages": 5, "totalPassages": 10, "currentTotalScore": 9.5},
            "history": [
                {"year": 2024, "score": 9.5, "apparatus": "BA"},
                {"year": 2024, "score": 8.5, "apparatus": "SS"},
                {"year": 2023, "score": 9.0, "apparatus": "BA"}
            ],
            "timeline": []
        }'''
    ))

    # 1. Go to Home
    print("Navigating to home...")
    page.goto("http://localhost:3000")

    # Check for "En piste maintenant" (loaded from live)
    expect(page.get_by_text("En piste maintenant")).to_be_visible()

    # Check for the group card
    # Use first() because it might appear in Hero and Carousel
    group_card = page.get_by_text("FSG Mock").first
    expect(group_card).to_be_visible()

    # Click it
    print("Clicking group card...")
    group_card.click()

    # Verify modal opens
    expect(page.get_by_role("dialog")).to_be_visible()

    # Verify content in modal
    expect(page.get_by_text("FSG Mock")).to_be_visible()

    # Screenshot 1: Home + Modal
    page.screenshot(path="/home/jules/verification/home_modal.png")
    print("Screenshot taken: home_modal.png")

    # Close modal
    page.get_by_label("Fermer").click()

    # 2. Go to Schedule
    print("Navigating to schedule...")
    page.goto("http://localhost:3000/schedule")

    # Click item
    schedule_item = page.get_by_text("FSG Mock").first
    schedule_item.click()

    # Verify modal
    expect(page.get_by_role("dialog")).to_be_visible()
    page.screenshot(path="/home/jules/verification/schedule_modal.png")
    print("Screenshot taken: schedule_modal.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
