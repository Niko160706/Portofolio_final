import os
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE = os.environ.get("PORTFOLIO_BASE", "http://localhost:4321")

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)


def wait(seconds=0.35):
    time.sleep(seconds)


def scroll_to(element):
    driver.execute_script("arguments[0].scrollIntoView({block:'start'});", element)
    wait(0.35)


try:
    driver.get(BASE + "/")
    wait(1.8)
    driver.execute_script("document.documentElement.style.scrollBehavior = 'auto'")

    # V3: no OS shell, taskbar, or desktop icons.
    assert not driver.find_elements(By.ID, "taskbar-start-button")
    assert not driver.find_elements(By.CLASS_NAME, "desktop-icon-rail")
    assert not driver.find_elements(By.CLASS_NAME, "luna-taskbar")
    assert "Syahputra" in driver.find_element(By.CSS_SELECTOR, ".hero-title").text
    assert len(driver.find_elements(By.CSS_SELECTOR, ".site-nav__link")) == 5
    print("V3 shell: PASS")

    # AN-01
    driver.find_element(By.XPATH, "//button[normalize-space()='What is this?']").click()
    wait(0.25)
    driver.find_element(By.ID, "assistant-inspect-trigger").click()
    wait(0.6)
    assert driver.find_element(By.CSS_SELECTOR, ".anomaly-note").is_displayed()
    assert "Maintain the friendly interface." in driver.find_element(By.CSS_SELECTOR, ".anomaly-body").text
    driver.find_element(By.CSS_SELECTOR, ".anomaly-actions .retro-action").click()
    wait(0.2)
    print("AN-01: PASS")

    # AN-02
    trace = driver.find_element(By.ID, "trace-inspect-trigger")
    scroll_to(trace)
    trace.click()
    wait(0.5)
    assert driver.find_element(By.CSS_SELECTOR, ".anomaly-note").is_displayed()
    assert "Discrepancy detected." in driver.find_element(By.CSS_SELECTOR, ".anomaly-body").text
    driver.find_element(By.CSS_SELECTOR, ".anomaly-actions .retro-action").click()
    wait(0.2)
    assert driver.find_element(By.CLASS_NAME, "console-anomaly").is_displayed()
    print("AN-02: PASS")

    # AN-03
    scroll_to(driver.find_element(By.ID, "lab"))
    driver.find_element(By.CSS_SELECTOR, ".retro-check input").click()
    wait(0.2)
    assert driver.find_element(By.CSS_SELECTOR, ".hidden-row").is_displayed()
    driver.find_element(By.CSS_SELECTOR, ".hidden-row .retro-action").click()
    wait(0.5)
    assert "Who decides what you are allowed to see?" in driver.find_element(By.CSS_SELECTOR, ".anomaly-body").text
    driver.find_element(By.CSS_SELECTOR, ".anomaly-actions .retro-action").click()
    wait(0.2)
    print("AN-03: PASS")

    # AN-04 from the Lab utility, not a Start menu.
    driver.find_element(By.ID, "run-diagnostics").click()
    wait(0.5)
    terminal = driver.find_element(By.CLASS_NAME, "diagnostics-terminal").text
    assert "ASSISTANT: Everything is operating normally." in terminal
    assert "UNKNOWN: That is what the interface was instructed to say." in terminal
    driver.find_element(By.CSS_SELECTOR, ".anomaly-actions .retro-action").click()
    wait(0.2)
    print("AN-04: PASS")

    # Matrix demo
    scroll_to(driver.find_element(By.ID, "work-visualize"))
    polygon = driver.find_element(By.CSS_SELECTOR, ".matrix-demo polygon:last-of-type")
    before = polygon.get_attribute("points")
    slider = driver.find_element(By.CSS_SELECTOR, ".matrix-control input[type='range']")
    driver.execute_script(
        """
        const input = arguments[0];
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, '2');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        """,
        slider,
    )
    wait(0.3)
    assert polygon.get_attribute("points") != before
    driver.find_element(By.CSS_SELECTOR, ".matrix-reset").click()
    print("Matrix demo: PASS")

    # Settings and effects
    preferences = driver.find_element(By.ID, "preferences-button")
    scroll_to(preferences)
    preferences.click()
    wait(0.25)
    assert driver.find_element(By.CLASS_NAME, "utility-dialog").is_displayed()
    driver.find_element(By.CLASS_NAME, "utility-close").click()
    wait(0.2)
    before_effects = driver.find_element(By.ID, "effects-toggle-button").text
    driver.find_element(By.ID, "effects-toggle-button").click()
    wait(0.2)
    after_effects = driver.find_element(By.ID, "effects-toggle-button").text
    assert before_effects != after_effects
    driver.find_element(By.ID, "effects-toggle-button").click()
    print("Settings + effects: PASS")

    # Mobile
    driver.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True},
    )
    wait(0.4)
    driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
    wait(0.3)
    driver.find_element(By.CSS_SELECTOR, ".menu-toggle").click()
    wait(0.25)
    assert driver.find_element(By.ID, "mobile-navigation").is_displayed()
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    wait(0.2)
    assert not driver.find_elements(By.ID, "mobile-navigation")
    assert driver.execute_script("return document.documentElement.scrollWidth") == 390
    print("Mobile homepage: PASS")

    # Document header/footer and mobile menu
    driver.get(BASE + "/about/")
    wait(0.8)
    driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
    wait(0.2)
    assert not driver.find_elements(By.CLASS_NAME, "luna-taskbar")
    summary = driver.find_element(By.CSS_SELECTOR, ".doc-site-header .mobile-menu-details summary")
    assert summary.is_displayed()
    summary.click()
    wait(0.25)
    assert driver.find_element(By.CSS_SELECTOR, ".doc-site-header .mobile-menu").is_displayed()
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    wait(0.2)
    print("Document pages: PASS")

    # Widths / no horizontal overflow
    for width in (320, 360, 390, 768, 1024, 1366, 1440):
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {"width": width, "height": 900, "deviceScaleFactor": 1, "mobile": width <= 639},
        )
        wait(0.2)
        driver.get(BASE + "/")
        wait(0.6)
        scroll_width = driver.execute_script("return document.documentElement.scrollWidth")
        inner_width = driver.execute_script("return window.innerWidth")
        assert scroll_width <= inner_width + 1, f"Overflow at {width}: {scroll_width} > {inner_width}"
    print("Responsive widths: PASS")

    print("V3 E2E SMOKE PASSED")
finally:
    driver.quit()
