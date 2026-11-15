import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE = "http://localhost:4321"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--hide-scrollbars")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)


def wait(seconds=0.3):
    time.sleep(seconds)


try:
    driver.get(BASE + "/")
    wait(1.8)
    driver.execute_script("document.documentElement.style.scrollBehavior = 'auto'")

    fonts = driver.execute_script(
        """
        return {
          bricolage: document.fonts.check('700 40px "Bricolage Grotesque"'),
          inter: document.fonts.check('400 16px "Inter"'),
          instrument: document.fonts.check('italic 400 20px "Instrument Serif"'),
          mono: document.fonts.check('400 12px "IBM Plex Mono"')
        };
        """
    )
    print("FONTS:", fonts)
    assert all(fonts.values()), "Required fonts failed to load"

    # Start menu opens, focuses, closes on Escape.
    driver.find_element(By.ID, "taskbar-start-button").click()
    wait(0.25)
    assert driver.find_element(By.ID, "start-menu-panel").is_displayed()
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    wait(0.2)
    assert not driver.find_elements(By.ID, "start-menu-panel")
    print("START MENU: PASS")

    # Hero window minimize, restore, close, restore.
    driver.find_element(By.CSS_SELECTOR, ".portfolio-window .luna-caption-btn").click()
    wait(0.2)
    assert not driver.find_elements(By.CSS_SELECTOR, ".portfolio-body")
    driver.find_elements(By.CSS_SELECTOR, ".taskbar-window")[0].click()
    wait(0.4)
    assert driver.find_element(By.CSS_SELECTOR, ".portfolio-body").is_displayed()
    driver.find_element(By.CSS_SELECTOR, ".portfolio-window .luna-caption-btn--close").click()
    wait(0.2)
    assert not driver.find_elements(By.CSS_SELECTOR, ".portfolio-window")
    driver.find_elements(By.CSS_SELECTOR, ".taskbar-window")[0].click()
    wait(0.4)
    assert driver.find_element(By.CSS_SELECTOR, ".portfolio-window").is_displayed()
    print("HERO WINDOW CONTROLS: PASS")

    # Sticky chrome minimize, close, restore.
    driver.execute_script("document.getElementById('work').scrollIntoView({block:'start'})")
    wait(0.4)
    assert int(driver.execute_script("return document.querySelector('#chrome').getBoundingClientRect().top")) == 0
    driver.find_elements(By.CSS_SELECTOR, "#chrome .sticky-titlebar-controls .luna-caption-btn")[0].click()
    wait(0.2)
    assert driver.find_elements(By.CSS_SELECTOR, "#chrome.is-minimized")
    driver.find_elements(By.CSS_SELECTOR, "#chrome .sticky-titlebar-controls .luna-caption-btn")[0].click()
    wait(0.2)
    driver.find_element(By.CSS_SELECTOR, "#chrome .luna-caption-btn--close").click()
    wait(0.2)
    assert not driver.find_elements(By.CSS_SELECTOR, "#chrome")
    driver.find_elements(By.CSS_SELECTOR, ".taskbar-window")[0].click()
    wait(0.4)
    assert driver.find_element(By.ID, "chrome").is_displayed()
    print("STICKY CHROME CONTROLS: PASS")

    # Assistant minimize, close, restore.
    driver.execute_script("document.querySelector('.desktop-assistant').scrollIntoView({block:'center'})")
    wait(0.3)
    driver.find_element(By.CSS_SELECTOR, ".assistant-window .luna-caption-btn").click()
    wait(0.2)
    assert not driver.find_elements(By.CSS_SELECTOR, ".assistant-window .assistant-widget")
    driver.find_element(By.CSS_SELECTOR, ".assistant-window .luna-caption-btn").click()
    wait(0.2)
    driver.find_element(By.CSS_SELECTOR, ".assistant-window .luna-caption-btn--close").click()
    wait(0.2)
    assert driver.find_element(By.CSS_SELECTOR, ".assistant-restore").is_displayed()
    driver.find_element(By.CSS_SELECTOR, ".assistant-restore").click()
    wait(0.3)
    assert driver.find_element(By.CSS_SELECTOR, ".assistant-window").is_displayed()
    print("ASSISTANT CONTROLS: PASS")

    # Matrix demo activation, slider, reset.
    driver.execute_script("document.getElementById('work-visualize').scrollIntoView({block:'center'})")
    wait(0.3)
    run_buttons = driver.find_elements(By.XPATH, "//button[normalize-space()='Run demo']")
    assert run_buttons
    run_buttons[0].click()
    wait(0.5)
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
    wait(0.3)
    assert polygon.get_attribute("points") == before
    print("MATRIX DEMO: PASS")

    # Copy email and preferences.
    driver.execute_script("document.querySelector('.contact-copy-row button').scrollIntoView({block:'center'})")
    wait(0.3)
    driver.find_element(By.CSS_SELECTOR, ".contact-copy-row button").click()
    wait(0.5)
    status = driver.find_element(By.CSS_SELECTOR, ".contact-copy-status").text.lower()
    assert "copied" in status or "selected" in status
    print("COPY EMAIL:", status)

    driver.execute_script("document.getElementById('preferences-button').scrollIntoView({block:'center'})")
    wait(0.3)
    driver.find_element(By.ID, "preferences-button").click()
    wait(0.3)
    assert driver.find_element(By.CSS_SELECTOR, ".retro-modal").is_displayed()
    driver.find_element(By.CSS_SELECTOR, ".retro-modal .luna-caption-btn--close, .retro-modal .caption-btn-close").click()
    wait(0.2)
    assert not driver.find_elements(By.CSS_SELECTOR, ".retro-modal")
    print("PREFERENCES: PASS")

    # Mobile compact OS and overflow.
    driver.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True},
    )
    wait(0.5)
    driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
    wait(0.3)
    assert driver.find_element(By.CSS_SELECTOR, ".mobile-os-header").is_displayed()
    assert driver.find_element(By.CSS_SELECTOR, ".mobile-dock").is_displayed()
    driver.find_element(By.CSS_SELECTOR, ".mobile-menu-toggle").click()
    wait(0.25)
    assert driver.find_element(By.ID, "mobile-navigation").is_displayed()
    driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    wait(0.25)
    assert not driver.find_elements(By.ID, "mobile-navigation")
    assert driver.execute_script("return document.documentElement.scrollWidth") == 390
    print("MOBILE COMPACT OS: PASS")

    print("LUNA REFINEMENT CHECKS PASSED")
finally:
    driver.quit()
