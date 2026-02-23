from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        # Navigate to Food page
        print("Navigating to /food...")
        response = page.goto("http://localhost:3000/food")
        print(f"Status: {response.status}")

        if response.status == 200:
             # Check if page loaded (Food title)
            page.wait_for_selector("h1", timeout=10000)

            # Screenshot
            page.screenshot(path="verification_food.png")
            print("Food page verified.")
        else:
            print("Page returned non-200 status")
            page.screenshot(path="error_food.png")

    except Exception as e:
        print(f"Error verifying food page: {e}")
        page.screenshot(path="error_food.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
