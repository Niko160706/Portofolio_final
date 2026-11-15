import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1366,768")
driver = webdriver.Chrome(options=options)

try:
    driver.execute_cdp_cmd("Emulation.setScriptExecutionDisabled", {"value": True})
    routes = {
        "/": "Niko Rajani",
        "/projects/": "Deep Research",
        "/about/": "Niko Rajani",
        "/contact/": "gradientacademy57@gmail.com",
        "/projects/deep-research/": "Problem Statement",
    }
    for route, marker in routes.items():
        driver.get("http://localhost:4321" + route)
        time.sleep(0.8)
        body = driver.find_element(By.TAG_NAME, "body").text
        links = driver.find_elements(By.TAG_NAME, "a")
        print(route, "| body chars:", len(body), "| links:", len(links))
        assert marker in body, f"Missing no-JS content '{marker}' on {route}"
        assert len(links) > 3, f"No navigation links without JS on {route}"
    print("NO-JS CONTENT CHECK PASSED")
finally:
    driver.quit()
