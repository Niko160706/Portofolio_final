import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless=new")
options.add_argument("--hide-scrollbars")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)

sections = [
    "hero-section",
    "selected-work",
    "research-lab",
    "how-i-work",
    "about-experience",
    "contact-channels",
]

try:
    driver.get("http://localhost:4321/")
    time.sleep(2.2)

    for width, height, suffix in [(1440, 900, "1440"), (390, 844, "390")]:
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width < 500},
        )
        time.sleep(0.6)
        driver.execute_script("window.scrollTo(0, 0)")
        time.sleep(0.3)

        for section in sections:
            element = driver.find_element("id", section)
            driver.execute_script(
                "arguments[0].scrollIntoView({behavior: 'instant', block: 'start'});", element
            )
            time.sleep(0.35)
            path = rf"C:\Users\niko\Videos\Portofolio_final\artifacts\section_{section}_{suffix}.png"
            with open(path, "wb") as file:
                file.write(element.screenshot_as_png)
            print("saved", path)

    fonts = driver.execute_script(
        """
        return {
          bricolage: document.fonts.check('700 40px "Bricolage Grotesque"'),
          inter: document.fonts.check('400 16px "Inter"'),
          instrument: document.fonts.check('italic 400 20px "Instrument Serif"'),
          plexMono: document.fonts.check('400 12px "IBM Plex Mono"'),
          status: document.fonts.status,
        };
        """
    )
    print("FONTS:", fonts)
finally:
    driver.quit()
