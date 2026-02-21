from playwright.sync_api import sync_playwright, expect
import time

def verify_spark():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to Schedule...")
        try:
            page.goto("http://localhost:3000/schedule", timeout=60000)
        except Exception as e:
            print(f"Failed to load schedule: {e}")
            return

        # 1. Verify Filter Sheet Buttons
        print("Checking Filter Sheet...")

        # Click on filter button
        # Look for button with aria-label="Filtrer" or title="Filtrer"
        filter_btn = page.get_by_label("Filtrer")
        # If not found, try by icon
        if not filter_btn.count():
             filter_btn = page.locator("button[title='Filtrer']")

        if filter_btn.count():
            filter_btn.click()
            print("Clicked filter button")

            # Wait for sheet to open
            page.wait_for_timeout(1000)

            # Check "Appliquer" button for active:scale-[0.98]
            # Since pseudo-classes like active are hard to check directly in playwright,
            # we check if the class active:scale-[0.98] is present in the class attribute.
            # Assuming tailwind compilation includes it.

            apply_btn = page.get_by_role("button", name="Appliquer") # or "Apply" depending on locale
            if not apply_btn.count():
                 apply_btn = page.locator("button", has_text="Appliquer")

            if apply_btn.count():
                classes = apply_btn.get_attribute("class")
                if "active:scale-[0.98]" in classes:
                    print("✅ Filter Apply button has active:scale-[0.98]")
                else:
                    print(f"❌ Filter Apply button missing active class. Found: {classes}")
            else:
                 print("⚠️ 'Appliquer' button not found")

            # Take screenshot of filter sheet
            page.screenshot(path="verification/filter_sheet.png")
        else:
            print("⚠️ Filter button not found")

        # 2. Verify Score Flash Animation on Results
        print("Navigating to Results...")
        page.goto("http://localhost:3000/results")
        page.wait_for_timeout(2000) # Wait for load

        # Check if there are results
        # Assuming at least one result card exists or skeleton

        # We need to simulate the score-flash class being added.
        # Find a result card.
        # Look for id starting with result-
        cards = page.locator("[id^='result-']")
        if cards.count() > 0:
            first_card = cards.first
            print(f"Found {cards.count()} result cards. Testing animation on first one.")

            # Inject JS to add class 'score-flash'
            first_card.evaluate("el => el.classList.add('score-flash')")

            # Wait a bit for animation to be visible
            page.wait_for_timeout(200)

            # Take screenshot
            page.screenshot(path="verification/verification.png")
            print("✅ Screenshot taken with score-flash active")
        else:
            print("⚠️ No result cards found. Cannot test animation.")
            # Take screenshot anyway
            page.screenshot(path="verification/results_page.png")

        browser.close()

if __name__ == "__main__":
    verify_spark()
