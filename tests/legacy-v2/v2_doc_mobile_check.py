import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=390,844")
driver = webdriver.Chrome(options=options)

try:
    for route in ("/projects/", "/about/", "/contact/", "/projects/visualize/"):
        driver.get("http://localhost:4321" + route)
        time.sleep(0.8)
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True},
        )
        time.sleep(0.4)
        summary = driver.find_element(By.CSS_SELECTOR, ".mobile-disclosure summary")
        assert summary.is_displayed(), f"Mobile header toggle missing on {route}"
        summary.click()
        time.sleep(0.3)
        panel = driver.find_element(By.CSS_SELECTOR, ".mobile-disclosure .mobile-nav")
        assert panel.is_displayed(), f"Mobile document menu did not open on {route}"
        print(route, "menu links:", len(panel.find_elements(By.TAG_NAME, "a")))
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
        time.sleep(0.3)
        details_open = driver.execute_script(
            "return document.querySelector('.mobile-disclosure').open"
        )
        assert not details_open, f"Mobile document menu did not close on Escape on {route}"
        widths = driver.execute_script(
            "return {scroll: document.documentElement.scrollWidth, inner: window.innerWidth}"
        )
        assert widths["scroll"] <= widths["inner"] + 1, f"Overflow on {route}: {widths}"
        print(route, "OK", widths)
    print("DOCUMENT MOBILE MENU CHECK PASSED")
finally:
    driver.quit()
