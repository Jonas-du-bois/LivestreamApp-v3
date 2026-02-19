
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device (iPhone 12)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        print("Navigating to /food...")
        try:
            page.goto("http://localhost:3000/food", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            browser.close()
            return

        print("Waiting for hydration...")

        # Wait for splash screen to disappear (up to 10 seconds)
        try:
            # Check if splash screen exists first
            if page.locator(".splash-screen").count() > 0:
                print("Splash screen detected. Waiting for it to disappear...")
                page.locator(".splash-screen").wait_for(state="detached", timeout=10000)
                print("Splash screen disappeared.")
            else:
                print("No splash screen detected.")
        except Exception as e:
            print(f"Error waiting for splash screen: {e}")
            # Take a debug screenshot
            page.screenshot(path="/home/jules/verification/debug_splash_stuck.png")

        # Wait a bit more for animations to settle
        time.sleep(2)

        # Take screenshots of interactions
        try:
            # 1. Back button
            back_btn = page.locator("a[href='/']").first
            if back_btn.count() > 0:
                back_btn.hover()
                page.screenshot(path="/home/jules/verification/1_back_hover.png")
                # Simulate touch/active state via JS or CSS class injection if needed,
                # but Playwright's mouse down might not trigger :active perfectly in all cases without touch emulation.
                # However, we can try to force the state or just rely on hover for now.

                # To test active, we can dispatch events
                box = back_btn.bounding_box()
                if box:
                    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    page.mouse.down()
                    page.screenshot(path="/home/jules/verification/1_back_active.png")
                    page.mouse.up()
            else:
                print("Back button not found")

            # 2. Category Chips
            chip = page.locator("button", has_text="Plats Chauds").first
            if chip.count() > 0:
                chip.hover()
                page.screenshot(path="/home/jules/verification/2_category_hover.png")

                box = chip.bounding_box()
                if box:
                    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    page.mouse.down()
                    page.screenshot(path="/home/jules/verification/2_category_active.png")
                    page.mouse.up()
            else:
                print("Category chip 'Plats Chauds' not found")

            # 3. Food Card
            # The first card
            card = page.locator(".group").first
            if card.count() > 0:
                card.scroll_into_view_if_needed()
                card.hover()
                page.screenshot(path="/home/jules/verification/3_card_hover.png")

                box = card.bounding_box()
                if box:
                    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    page.mouse.down()
                    page.screenshot(path="/home/jules/verification/3_card_active.png")
                    page.mouse.up()
            else:
                print("Food card not found")

            print("Screenshots captured.")

        except Exception as e:
            print(f"Error capturing screenshots: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")

        browser.close()

if __name__ == "__main__":
    run()
