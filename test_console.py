from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    logs = []
    page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))

    page.goto('http://localhost:8080/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Print console logs
    print("=== Console Logs ===")
    for log in logs:
        print(log)

    # Check for errors
    errors = [log for log in logs if 'error' in log.lower()]
    if errors:
        print("\n=== Errors Found ===")
        for err in errors:
            print(err)

    # Take screenshot
    page.screenshot(path='/tmp/page.png', full_page=True)
    print("\nScreenshot saved to /tmp/page.png")

    browser.close()