
import asyncio
from playwright.async_api import async_playwright, expect

async def verify_map_toggle():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the plan page
        # Note: The port might need adjustment based on where 'npm run preview' serves the app.
        # Usually Nuxt preview runs on port 3000 by default.
        try:
            await page.goto("http://localhost:3000/plan")

            # Wait for the map container to ensure page load
            await page.wait_for_selector('.leaflet-container', state='visible', timeout=10000)

            # Locate the toggle button
            # We look for the button with the ARIA label 'Afficher la vue satellite' (default state)
            # Adjust the label based on the actual translation if needed, or use a more generic selector for the button in the bottom right

            # Taking a screenshot of the initial state (Map View)
            await page.screenshot(path="verification_map_view.png")
            print("Screenshot taken: verification_map_view.png")

            # Find the button
            # Based on the code: :aria-label="isSatellite ? t('plan.showMap') : t('plan.showSatellite')"
            # We assume French default locale: "Afficher la vue satellite"
            toggle_btn = page.locator('button[aria-label="Afficher la vue satellite"]')

            if await toggle_btn.count() == 0:
                 # Fallback: try finding by class or hierarchy if aria-label is different
                 toggle_btn = page.locator('.absolute.bottom-24.right-4 button')

            if await toggle_btn.count() > 0:
                print("Toggle button found.")

                # Click the button to switch to Satellite view
                await toggle_btn.click()

                # Wait for the transition/state change
                # The button aria-label should change to "Afficher le plan"
                # And the icon inside should change
                await page.wait_for_timeout(1000) # Wait for animation

                # Take a screenshot of the satellite state
                await page.screenshot(path="verification_satellite_view.png")
                print("Screenshot taken: verification_satellite_view.png")
            else:
                print("Toggle button NOT found.")

        except Exception as e:
            print(f"Error during verification: {e}")
            await page.screenshot(path="verification_error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_map_toggle())
