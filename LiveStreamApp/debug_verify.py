from playwright.sync_api import sync_playwright, expect

def run(page):
    print("Navigating to home...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(3000)

    page.screenshot(path="/home/jules/verification/debug_home.png")

    # Try clicking Happenning Now item (Carousel)
    # Look for text "FSG"
    fsg = page.get_by_text("FSG").first
    if fsg.is_visible():
        print("Found FSG text, clicking parent...")
        fsg.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/debug_click_home.png")
        if page.get_by_role("dialog").is_visible():
            print("Modal opened!")
        else:
            print("Modal did NOT open.")
    else:
        print("FSG text not found.")

    print("Navigating to schedule...")
    page.goto("http://localhost:3000/schedule")
    page.wait_for_timeout(3000)
    page.screenshot(path="/home/jules/verification/debug_schedule.png")

    # Click on "Sol"
    sol = page.get_by_text("Sol").first
    if sol.is_visible():
        print("Found Sol, clicking...")
        sol.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/debug_click_schedule.png")
        if page.get_by_role("dialog").is_visible():
            print("Modal opened!")
        else:
            print("Modal did NOT open.")
    else:
        print("Sol not found.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
