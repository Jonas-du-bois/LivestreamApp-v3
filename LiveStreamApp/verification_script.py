from playwright.sync_api import Page, expect, sync_playwright
import time
import os

def wait_for_splash(page: Page):
    print("Waiting for splash screen to disappear...")
    # Wait for .splash-screen to not be visible or detached
    # Assuming there is an element with class .splash-screen or similar.
    # Alternatively, wait for an element that only appears on the main page.
    # The splash screen usually covers everything.
    # Let's wait for a main content element like 'header' or 'nav' or just hard wait.
    time.sleep(5) # Simple wait first
    # Or wait for locator
    # page.locator(".splash-screen").wait_for(state="detached", timeout=10000)

def verify_ui_changes(page: Page):
    # 1. Verify Food Page
    print("Navigating to /food...")
    page.goto("http://localhost:3000/food")
    wait_for_splash(page)
    # Scroll a bit to see content
    page.mouse.wheel(0, 200)
    time.sleep(1)
    page.screenshot(path="/home/jules/verification/food_page.png", full_page=True)
    print("Screenshot saved: food_page.png")

    # 2. Verify Afterparty Page
    print("Navigating to /afterparty...")
    page.goto("http://localhost:3000/afterparty")
    wait_for_splash(page)
    time.sleep(2)
    page.screenshot(path="/home/jules/verification/afterparty_page.png", full_page=True)
    print("Screenshot saved: afterparty_page.png")

    # 3. Verify Plan Page
    print("Navigating to /plan...")
    page.goto("http://localhost:3000/plan")
    wait_for_splash(page)
    time.sleep(5) # Map load
    page.screenshot(path="/home/jules/verification/plan_page.png", full_page=True)
    print("Screenshot saved: plan_page.png")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            verify_ui_changes(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
