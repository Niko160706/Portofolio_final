import base64
import os
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ARTIFACTS = r"C:\Users\niko\Videos\Portofolio_final\artifacts"
os.makedirs(ARTIFACTS, exist_ok=True)

options = Options()
options.add_argument("--headless=new")
options.add_argument("--hide-scrollbars")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)

routes = [
    ("about", "/about/"),
    ("contact", "/contact/"),
    ("projects", "/projects/"),
    ("case-deep", "/projects/deep-research/"),
    ("case-umkm", "/projects/umkm-ecommerce/"),
    ("404", "/404.html"),
]

try:
    for name, route in routes:
        driver.get("http://localhost:4321" + route)
        time.sleep(1.0)
        for width, height, suffix, mobile in [
            (1440, 900, "1440", False),
            (390, 844, "390", True),
        ]:
            driver.execute_cdp_cmd(
                "Emulation.setDeviceMetricsOverride",
                {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": mobile},
            )
            time.sleep(0.5)
            shot = driver.execute_cdp_cmd(
                "Page.captureScreenshot",
                {"format": "png", "captureBeyondViewport": True, "fromSurface": True},
            )
            path = os.path.join(ARTIFACTS, f"doc_{name}_{suffix}.png")
            with open(path, "wb") as file:
                file.write(base64.b64decode(shot["data"]))
            print("saved", path)
        driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
finally:
    driver.quit()
