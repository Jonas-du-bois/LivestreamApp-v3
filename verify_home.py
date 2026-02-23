from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        # Navigate to Home page
        print("Navigating to /...")
        response = page.goto("http://localhost:3000/")
        print(f"Status: {response.status}")

        if response.status == 200:
             # Check if page loaded (Hero title)
            page.wait_for_selector("h2", timeout=10000)

            # Screenshot
            page.screenshot(path="verification_home.png")
            print("Home page verified.")
        else:
            print("Page returned non-200 status")
            page.screenshot(path="error_home.png")

    except Exception as e:
        print(f"Error verifying home page: {e}")
        page.screenshot(path="error_home.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
