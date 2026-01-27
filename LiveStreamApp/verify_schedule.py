from playwright.sync_api import Page, expect, sync_playwright
import time

def test_schedule_page(page: Page):
    print("Seeding DB...")
    response = page.goto("http://localhost:3001/api/seed")
    print(f"Seed response status: {response.status}")
    # Verify success text or just proceed

    print("Navigating to Schedule...")
    page.goto("http://localhost:3001/schedule")

    # Wait for data to load
    print("Waiting for page load...")
    page.wait_for_selector("button", timeout=10000)

    # Expect "Tout" chip
    expect(page.get_by_text("Tout")).to_be_visible()

    # Take screenshot of initial state
    print("Taking initial screenshot...")
    page.screenshot(path="/home/jules/verification/schedule_initial.png")

    # Click "Sol" if available
    # It might depend on seed data.
    # The seed data creates apparatus: SS (Sol), etc.
    # So "Sol" should be visible in chips.
    try:
        sol_btn = page.get_by_role("button", name="Sol")
        if sol_btn.is_visible():
            print("Clicking 'Sol' filter...")
            sol_btn.click()
            time.sleep(1)
            page.screenshot(path="/home/jules/verification/schedule_filtered.png")
        else:
            print("'Sol' button not visible")
    except Exception as e:
        print(f"Could not click Sol: {e}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_schedule_page(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()
