from playwright.sync_api import sync_playwright, expect

def run(page):
    # 1. Go to Home
    print("Navigating to home...")
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # 1a. Test Hero Navigation to Stream
    print("Testing Hero -> Stream...")
    # Find the link that goes to a stream
    hero_link = page.locator("a[href^='/stream/']").first
    if hero_link.is_visible():
        hero_link.click()
        page.wait_for_timeout(2000)

        if "/stream/" in page.url:
            print("Navigated to stream page.")
            # 1b. Test Opening Modal from Stream Page
            # Scroll down to ensure "Sur le praticable" is visible
            # Find GroupInfoCard. It contains group name "FSG Yverdon".
            # We look for the text inside the card.
            group_name = page.get_by_text("FSG Yverdon").first
            if group_name.is_visible():
                print("Found Group Name on Stream page. Clicking...")
                group_name.click()
                page.wait_for_timeout(1000)

                if page.get_by_role("dialog").is_visible():
                    print("Modal opened on Stream page!")
                    page.screenshot(path="/home/jules/verification/stream_modal_success.png")
                    page.get_by_label("Fermer").click()
                else:
                    print("Modal did NOT open on Stream page.")
                    page.screenshot(path="/home/jules/verification/stream_modal_fail.png")
            else:
                 print("Group Name not found on Stream page.")
                 page.screenshot(path="/home/jules/verification/stream_page_debug.png")
        else:
            print("Did not navigate to stream page.")
    else:
        print("Hero link not found.")
        page.screenshot(path="/home/jules/verification/home_debug.png")

    # 2. Go to Schedule
    print("Navigating to schedule...")
    page.goto("http://localhost:3000/schedule")
    page.wait_for_timeout(2000)

    # Click on a Group Name
    print("Clicking a group in schedule...")
    group_item = page.get_by_text("FSG Yverdon").first
    if group_item.is_visible():
        group_item.click()
        page.wait_for_timeout(1000)

        if page.get_by_role("dialog").is_visible():
             print("Modal opened on Schedule!")
             page.screenshot(path="/home/jules/verification/schedule_modal_success.png")
        else:
             print("Modal did NOT open on Schedule.")
             page.screenshot(path="/home/jules/verification/schedule_modal_fail.png")
    else:
        print("FSG Yverdon not found in schedule.")
        page.screenshot(path="/home/jules/verification/schedule_debug.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 375, "height": 812})
        try:
            run(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
