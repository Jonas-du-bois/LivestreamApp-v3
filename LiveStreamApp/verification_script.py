from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # 1. Home Page
        print("Navigating to Home...")
        try:
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")
            page.screenshot(path="/home/jules/verification/01_home.png")
            print("Home screenshot saved.")
        except Exception as e:
            print(f"Failed to load Home: {e}")

        # 2. Schedule Page
        print("Navigating to Schedule...")
        try:
            page.goto("http://localhost:3000/schedule")
            # Wait for content or skeleton to load
            # Wait for skeleton to disappear (implies content loaded)
            # The skeleton has class "premium-skeleton-shimmer" or similar
            # Wait for meaningful content, e.g., a card
            page.wait_for_selector(".glass-card", timeout=10000)
            # Wait a bit for animations
            time.sleep(2)
            page.screenshot(path="/home/jules/verification/02_schedule.png")
            print("Schedule screenshot saved.")
        except Exception as e:
            print(f"Failed to load Schedule: {e}")
            page.screenshot(path="/home/jules/verification/02_schedule_error.png")

        # 3. Results Page
        print("Navigating to Results...")
        try:
            page.goto("http://localhost:3000/results")
            # Wait for content
            page.wait_for_selector(".glass-card", timeout=10000)
            time.sleep(2)
            page.screenshot(path="/home/jules/verification/03_results.png")
            print("Results screenshot saved.")
        except Exception as e:
            print(f"Failed to load Results: {e}")
            page.screenshot(path="/home/jules/verification/03_results_error.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
