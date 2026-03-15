from playwright.sync_api import sync_playwright

def verify_infos_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Configure mobile viewport and dark mode
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            is_mobile=True,
            has_touch=True,
            color_scheme="dark"
        )
        page = context.new_page()

        # Go to the home page first
        page.goto("http://localhost:3000/")
        page.wait_for_load_state('networkidle')

        # Navigate to infos
        page.goto("http://localhost:3000/infos")
        page.wait_for_load_state('networkidle')

        # Wait for the specific sections to be rendered
        page.wait_for_selector('text="Acces et parking"')
        page.wait_for_selector('text="Samaritains et premiers secours"')

        # Scroll down a bit to see the sections clearly
        page.evaluate("window.scrollBy(0, 500)")

        # Take a screenshot
        page.screenshot(path="verification.png")

        browser.close()

if __name__ == "__main__":
    verify_infos_page()
