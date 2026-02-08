from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    page.on("console", lambda msg: print(f"BROWSER LOG: {msg.text}"))
    page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

    print("Navigating...")
    page.goto("http://localhost:3000/admin/dashboard")

    print("Waiting for input...")
    inp = page.wait_for_selector("input[type='password']")

    print("Clicking input...")
    inp.click()

    print("Typing password...")
    page.keyboard.type("admin")

    page.wait_for_timeout(1000)

    print("Checking button state...")
    btn = page.locator("button[type='submit']")
    if btn.is_disabled():
        print("Button is DISABLED. Trying manual event dispatch...")
        page.evaluate("""
            const input = document.querySelector("input[type='password']");
            input.value = 'admin';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """)
        page.wait_for_timeout(500)

    if btn.is_disabled():
        print("Button still DISABLED after manual dispatch!")
        page.screenshot(path="debug_login_disabled.png")
    else:
        print("Button is ENABLED. Clicking...")
        btn.click()

        try:
            expect(page.get_by_text("Admin Dashboard")).to_be_visible(timeout=5000)
            print("Login SUCCESS!")
        except:
            print("Login failed or timed out.")
            page.screenshot(path="debug_login_fail.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
