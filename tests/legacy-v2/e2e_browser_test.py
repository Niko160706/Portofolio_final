import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE = "http://localhost:4321"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--hide-scrollbars")
options.add_argument("--window-size=1366,768")
driver = webdriver.Chrome(options=options)


def wait(seconds=0.35):
    time.sleep(seconds)


try:
    driver.get(BASE + "/")
    wait(1.5)

    # 0. Console health
    logs = driver.get_log("browser")
    severe = [entry for entry in logs if entry["level"] == "SEVERE"]
    print("Severe console errors:", severe)
    assert not severe, "Console errors found"

    # 1. First-view content and identity
    h1 = driver.find_element(By.TAG_NAME, "h1")
    print("H1:", h1.text.replace("\n", " "))
    assert "Niko Rajani" in h1.text and "Syahputra" in h1.text
    assert "Seeking Data Engineering Internship: Semester 6" in driver.page_source

    cv_links = [
        link for link in driver.find_elements(By.TAG_NAME, "a")
        if "/resume.pdf" in (link.get_attribute("href") or "")
    ]
    assert len(cv_links) >= 2, "CV should be discoverable from header and contact section"
    print("CV links found:", len(cv_links))

    github_links = [
        link for link in driver.find_elements(By.TAG_NAME, "a")
        if "github.com/Niko160706" in (link.get_attribute("href") or "")
    ]
    assert len(github_links) >= 1, "GitHub profile link missing"
    print("GitHub links found:", len(github_links))

    # 2. Normal document scrolling is present and not locked
    scroll_height = driver.execute_script("return document.documentElement.scrollHeight")
    inner_height = driver.execute_script("return window.innerHeight")
    overflow_y = driver.execute_script("return getComputedStyle(document.body).overflowY")
    print(f"scrollHeight={scroll_height}, innerHeight={inner_height}, body overflow-y={overflow_y}")
    assert scroll_height > inner_height * 2, "Page must scroll through independent sections"
    assert overflow_y != "hidden", "Body scroll must not be locked"

    # 3. Editorial navigation targets real sections
    nav_links = driver.find_elements(By.CSS_SELECTOR, ".site-nav__link")
    print("Desktop nav links:", [link.text.replace("\n", " ") for link in nav_links])
    assert len(nav_links) == 5

    for anchor in ["selected-work", "research-lab", "how-i-work", "about-experience", "contact-channels"]:
        driver.execute_script(
            f"document.getElementById('{anchor}').scrollIntoView({{behavior:'instant', block:'start'}});"
        )
        wait(0.25)
        offset = driver.execute_script("return window.scrollY")
        assert offset > 0, f"Section #{anchor} did not scroll"
    print("All five section anchors scroll.")

    # 4. Keyboard scrolling
    driver.execute_script("window.scrollTo(0, 0)")
    wait(0.2)
    ActionChains(driver).move_to_element(driver.find_element(By.TAG_NAME, "body")).click().send_keys(
        Keys.PAGE_DOWN
    ).perform()
    wait(0.4)
    assert driver.execute_script("return window.scrollY") > 0, "Keyboard PageDown did not scroll"
    print("Keyboard scrolling verified.")

    # 5. Four anomaly triggers
    what_is_this = driver.find_element(By.CLASS_NAME, "assistant-btn-subtle")
    driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", what_is_this)
    wait(0.3)
    what_is_this.click()
    wait(0.2)
    driver.find_element(By.ID, "assistant-inspect-trigger").click()
    wait(0.7)
    dialog = driver.find_element(By.CLASS_NAME, "anomaly-dialog")
    body = dialog.find_element(By.CLASS_NAME, "anomaly-body").text
    assert "Maintain the friendly interface" in body
    print("AN-01:", body)
    dialog.find_element(By.CLASS_NAME, "anomaly-btn").click()
    wait(0.3)

    trace = driver.find_element(By.ID, "trace-inspect-trigger")
    driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", trace)
    wait(0.35)
    trace.click()
    wait(0.7)
    dialog = driver.find_element(By.CLASS_NAME, "anomaly-dialog")
    body = dialog.find_element(By.CLASS_NAME, "anomaly-body").text
    assert "Discrepancy detected. Response framing updated." in body
    print("AN-02:", body)
    dialog.find_element(By.CLASS_NAME, "anomaly-btn").click()
    wait(0.3)

    lab = driver.find_element(By.ID, "research-lab")
    driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'start'});", lab)
    wait(0.3)
    for button in driver.find_elements(By.CLASS_NAME, "explorer-menu-btn"):
        if button.text.strip() == "View":
            driver.execute_script(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});", button
            )
            wait(0.25)
            button.click()
            break
    wait(0.2)
    driver.find_element(By.CSS_SELECTOR, '.dropdown-check-item input[type="checkbox"]').click()
    wait(0.3)
    hidden_log = driver.find_element(By.CLASS_NAME, "hidden-log-item")
    assert hidden_log.is_displayed()
    driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", hidden_log)
    wait(0.2)
    hidden_log.find_element(By.TAG_NAME, "button").click()
    wait(0.7)
    dialog = driver.find_element(By.CLASS_NAME, "anomaly-dialog")
    body = dialog.find_element(By.CLASS_NAME, "anomaly-body").text
    assert "Who decides what you are allowed to see?" in body
    print("AN-03:", body)
    dialog.find_element(By.CLASS_NAME, "anomaly-btn").click()
    wait(0.3)

    driver.find_element(By.ID, "taskbar-start-button").click()
    wait(0.3)
    diagnostics_button = driver.find_element(By.ID, "start-menu-diagnostics")
    diagnostics_button.click()
    wait(0.5)
    terminal = driver.find_element(By.CLASS_NAME, "diagnostics-terminal").text
    assert "ASSISTANT: Everything is operating normally." in terminal
    assert "UNKNOWN: That is what the interface was instructed to say." in terminal
    print("AN-04 terminal verified.")
    driver.find_element(By.CSS_SELECTOR, ".retro-modal .caption-btn-close").click()
    wait(0.3)

    # 6. Effects opt-out (footer) blocks anomalies
    effects_button = driver.find_element(By.ID, "effects-toggle-button")
    driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", effects_button)
    wait(0.25)
    effects_button.click()
    wait(0.3)
    assistant_subtle = driver.find_elements(By.CLASS_NAME, "assistant-btn-subtle")
    if assistant_subtle:
        driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", assistant_subtle[0])
        wait(0.2)
        assistant_subtle[0].click()
        wait(0.3)
    inspect_buttons = driver.find_elements(By.ID, "assistant-inspect-trigger")
    if inspect_buttons:
        driver.execute_script("arguments[0].scrollIntoView({behavior:'instant', block:'center'});", inspect_buttons[0])
        wait(0.2)
        inspect_buttons[0].click()
        wait(0.5)
    assert not driver.find_elements(By.CLASS_NAME, "anomaly-dialog"), "Effects off must block dialogs"
    print("Effects opt-out verified.")
    driver.execute_script(
        "arguments[0].scrollIntoView({behavior:'instant', block:'center'});", effects_button
    )
    wait(0.25)
    effects_button.click()
    wait(0.2)

    # 7. Mobile navigation
    driver.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True},
    )
    wait(0.5)
    driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
    wait(0.4)
    toggle = driver.find_element(By.CSS_SELECTOR, ".menu-toggle")
    assert toggle.is_displayed(), "Mobile menu toggle should be visible"
    toggle.click()
    wait(0.35)
    mobile_nav = driver.find_element(By.ID, "mobile-navigation")
    assert mobile_nav.is_displayed()
    assert len(mobile_nav.find_elements(By.TAG_NAME, "a")) == 6
    escaped = driver.find_element(By.TAG_NAME, "body")
    escaped.send_keys(Keys.ESCAPE)
    wait(0.3)
    assert not driver.find_elements(By.ID, "mobile-navigation"), "Mobile menu should close on Escape"
    assert driver.execute_script("return document.documentElement.scrollWidth") <= 390
    print("Mobile navigation and no horizontal overflow verified.")
    driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})

    # 8. Routes
    routes = {
        "/projects/": "Project Archive",
        "/projects/deep-research/": "Deep Research Engine",
        "/about/": "About Niko",
        "/contact/": "Contact Channels",
    }
    for route, expected in routes.items():
        driver.get(BASE + route)
        wait(0.6)
        assert expected.lower() in driver.title.lower(), f"{route} title mismatch: {driver.title}"
        assert "404" not in driver.title.lower(), f"{route} returned an error page"
        print(f"Route OK: {route} -> {driver.title}")

    print("\nALL EDITORIAL HOMEPAGE, ANOMALY, MOBILE, AND ROUTE CHECKS PASSED")
finally:
    driver.quit()
