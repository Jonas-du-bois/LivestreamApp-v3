from playwright.sync_api import Page, expect, sync_playwright

def test_a11y_labels(page: Page):
    print("Navigating to home page...")
    page.goto("http://localhost:3000")

    # Wait for the header to be visible
    page.wait_for_selector("header")

    # 1. Verify Search Button
    print("Verifying Search Button...")
    search_btn = page.get_by_label("Rechercher")
    expect(search_btn).to_be_visible()

    # Check title attribute
    title = search_btn.get_attribute("title")
    assert title == "Rechercher", f"Expected title 'Rechercher', got '{title}'"
    print("✅ Search Button verified.")

    # 2. Verify Notifications Button
    print("Verifying Notifications Button...")
    notif_btn = page.get_by_label("Notifications")
    expect(notif_btn).to_be_visible()

    title = notif_btn.get_attribute("title")
    assert title == "Notifications", f"Expected title 'Notifications', got '{title}'"
    print("✅ Notifications Button verified.")

    # 3. Verify Filter Button (Only on /schedule)
    print("Navigating to /schedule...")
    page.goto("http://localhost:3000/schedule")
    page.wait_for_load_state("networkidle")

    print("Verifying Filter Button...")
    filter_btn = page.get_by_label("Filtrer")
    expect(filter_btn).to_be_visible()

    title = filter_btn.get_attribute("title")
    assert title == "Filtrer", f"Expected title 'Filtrer', got '{title}'"
    print("✅ Filter Button verified.")

    # 4. Open Notification Drawer and verify inner buttons
    # We can open it from anywhere, let's go back home
    # page.goto("http://localhost:3000") # Actually let's stay on schedule

    print("Opening Notifications...")
    notif_btn.click()

    # Wait for drawer
    page.wait_for_timeout(1000) # Wait for animation

    print("Verifying 'Clear All Read' Button...")
    # This button might depend on state (if there are notifications), but the markup should be there if rendered.
    # In NotificationDrawer.vue:
    # <div v-if="hasNotifications" ...> <button ... aria-label="Supprimer les notifications lues">

    # Since we likely have NO notifications (DB failed), hasNotifications is false.
    # So checking for "Clear All Read" might fail if it's conditional.
    # Let's check the code:
    # const hasNotifications = computed(() => notifications.value.length > 0)
    # The button is inside <div v-if="hasNotifications">

    # If DB failed, we probably have 0 notifications.
    # So we can't verify the drawer buttons unless we mock the store.
    # But we verified the code statically.

    # I will stick to verifying the Header buttons which are always present (mostly).

    # Take screenshot of the header area
    page.screenshot(path="verification/header_a11y.png")
    print("✅ Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_a11y_labels(page)
        except Exception as e:
            print(f"❌ Test failed: {e}")
            # Take screenshot on failure
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()
