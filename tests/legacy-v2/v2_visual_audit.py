import base64
import json
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

viewports = [
    ("1440x900", 1440, 900, False),
    ("1366x768", 1366, 768, False),
    ("768x1024", 768, 1024, False),
    ("390x844", 390, 844, True),
]

try:
    driver.get("http://localhost:4321/")
    time.sleep(2.5)

    severe = [l for l in driver.get_log("browser") if l["level"] == "SEVERE"]
    print("SEVERE console errors:", json.dumps(severe, indent=2))

    fonts = driver.execute_script(
        """
        return {
          bricolage: document.fonts.check('700 40px "Bricolage Grotesque"'),
          inter: document.fonts.check('400 16px "Inter"'),
          instrument: document.fonts.check('italic 400 20px "Instrument Serif"'),
          plexMono: document.fonts.check('400 12px "IBM Plex Mono"'),
          loaded: [...document.fonts].map(f => f.family + ':' + f.status + ':' + f.weight),
        };
        """
    )
    print("FONT CHECK:", json.dumps(fonts, indent=2))
    assert all(
        fonts[key] for key in ("bricolage", "inter", "instrument", "plexMono")
    ), "Required fonts failed to load"

    for name, w, h, mobile in viewports:
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mobile},
        )
        time.sleep(0.7)

        metrics = driver.execute_script(
            """
            const d = document.documentElement;
            const sections = [...document.querySelectorAll('main > section, body > footer')].map(el => ({
              id: el.id || el.className,
              top: Math.round(el.getBoundingClientRect().top + window.scrollY),
              height: Math.round(el.getBoundingClientRect().height),
            }));
            const h1 = document.querySelector('h1');
            const navLinks = document.querySelector('.site-nav');
            const menuToggle = document.querySelector('.menu-toggle');
            const header = document.querySelector('#chrome');
            const interactive = [...document.querySelectorAll('a, button')];
            const tooSmall = interactive.filter(el => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
            }).map(el => (el.textContent || el.id || el.className).trim().slice(0, 40));
            return {
              scrollHeight: d.scrollHeight,
              innerHeight: window.innerHeight,
              scrollWidth: d.scrollWidth,
              innerWidth: window.innerWidth,
              bodyOverflowY: getComputedStyle(document.body).overflowY,
              htmlOverflowY: getComputedStyle(d).overflowY,
              h1Font: h1 ? getComputedStyle(h1).fontFamily : null,
              h1Size: h1 ? getComputedStyle(h1).fontSize : null,
              h1Height: h1 ? Math.round(h1.getBoundingClientRect().height) : null,
              headerPosition: header ? getComputedStyle(header).position : null,
              navDisplay: navLinks ? getComputedStyle(navLinks).display : null,
              menuToggleDisplay: menuToggle ? getComputedStyle(menuToggle).display : null,
              sections,
              interactiveCount: interactive.length,
              tooSmall: tooSmall.slice(0, 30),
            };
            """
        )
        print(f"\n--- {name} ---")
        print(json.dumps(metrics, indent=2))

        shot = driver.execute_cdp_cmd(
            "Page.captureScreenshot",
            {"format": "png", "captureBeyondViewport": True, "fromSurface": True},
        )
        with open(os.path.join(ARTIFACTS, f"full_{name}.png"), "wb") as f:
            f.write(base64.b64decode(shot["data"]))
        print("saved", f"full_{name}.png")

        viewport_shot = driver.execute_cdp_cmd(
            "Page.captureScreenshot",
            {"format": "png", "captureBeyondViewport": False, "fromSurface": True},
        )
        with open(os.path.join(ARTIFACTS, f"viewport_{name}.png"), "wb") as f:
            f.write(base64.b64decode(viewport_shot["data"]))

    driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
    driver.set_window_size(1440, 900)
    time.sleep(0.5)

    before = driver.execute_script("return window.scrollY")
    driver.execute_script("window.scrollBy({top: 900, behavior: 'instant'})")
    time.sleep(0.4)
    after = driver.execute_script("return window.scrollY")
    print(f"\nProgrammatic scroll: before={before}, after={after}")
    assert after > before, "Programmatic scroll failed"

    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.common.keys import Keys

    body = driver.find_element("tag name", "body")
    ActionChains(driver).move_to_element(body).click().send_keys(Keys.PAGE_DOWN).perform()
    time.sleep(0.5)
    after_key = driver.execute_script("return window.scrollY")
    print(f"Keyboard PageDown scrollY={after_key}")
    assert after_key > after, "Keyboard scroll failed"

    # Mobile navigation test
    driver.execute_cdp_cmd(
        "Emulation.setDeviceMetricsOverride",
        {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True},
    )
    time.sleep(0.4)
    driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
    time.sleep(0.4)
    toggle = driver.find_element("css selector", ".menu-toggle")
    print("Mobile menu toggle displayed:", toggle.is_displayed())
    assert toggle.is_displayed(), "Mobile menu toggle should be visible at 390px"
    toggle.click()
    time.sleep(0.4)
    mobile_nav = driver.find_element("id", "mobile-navigation")
    assert mobile_nav.is_displayed(), "Mobile nav should open"
    print("Mobile menu opened, links:", len(mobile_nav.find_elements("tag name", "a")))
    driver.find_element("tag name", "body").send_keys(Keys.ESCAPE)
    time.sleep(0.3)
    assert not driver.find_elements("id", "mobile-navigation"), "Mobile nav should close on Escape"
    print("Mobile menu closed on Escape")

    print("\nVISUAL AUDIT COMPLETE")
finally:
    driver.quit()
