import asyncio
import os
import re
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        extension_path = os.path.abspath('.')
        user_data_dir = '/tmp/test-user-data-dir'

        # Clean up old user data dir
        if os.path.exists(user_data_dir):
            import shutil
            shutil.rmtree(user_data_dir)

        context = await p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,  # Run in headed mode for debugging
            args=[
                f'--disable-extensions-except={extension_path}',
                f'--load-extension={extension_path}',
            ]
        )

        background_target = None
        # Wait up to 15 seconds for a service worker to appear
        try:
            print("Waiting for service worker...")
            background_target = await context.wait_for_event("serviceworker", timeout=15000)
            print("Service worker found.")
        except Exception:
            print("Could not find service worker in time, checking for background pages.")
            if context.background_pages:
                background_target = context.background_pages[0]
                print("Background page found.")

        if not background_target:
             print("Error: Could not find the extension's background page or service worker.")
             await context.close()
             return

        # Extract the extension ID from the background script's URL
        extension_id_match = re.search(r'chrome-extension://([a-z]+)/', background_target.url)
        if not extension_id_match:
            print(f"Could not extract extension ID from URL: {background_target.url}")
            await context.close()
            return

        extension_id = extension_id_match.group(1)
        print(f"Found extension ID: {extension_id}")

        # Construct the popup URL and navigate to it
        popup_url = f'chrome-extension://{extension_id}/popup.html'
        popup_page = await context.new_page()
        await popup_page.goto(popup_url)
        print(f"Navigated to popup URL: {popup_url}")

        # Wait for a specific element on the popup to ensure it has loaded
        await expect(popup_page.locator('#prisma-tools')).to_be_visible(timeout=10000)
        print("Popup content is visible.")

        # Take the screenshot
        screenshot_path = 'jules-scratch/verification/verification.png'
        await popup_page.screenshot(path=screenshot_path)
        print(f"Screenshot taken and saved to {screenshot_path}")

        await context.close()

if __name__ == '__main__':
    asyncio.run(main())