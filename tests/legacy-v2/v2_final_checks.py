import json
import time
import urllib.error
import urllib.request

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE = "http://localhost:4321"

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--hide-scrollbars")
options.add_argument("--window-size=1440,900")
driver = webdriver.Chrome(options=options)

try:
    driver.get(BASE + "/")
    time.sleep(1.8)

    # Anchor offset under sticky header
    driver.execute_script("document.documentElement.style.scrollBehavior = 'auto'")
    for href, section_id in [
        ("#selected-work", "selected-work"),
        ("#research-lab", "research-lab"),
        ("#how-i-work", "how-i-work"),
        ("#about-experience", "about-experience"),
        ("#contact-channels", "contact-channels"),
    ]:
        driver.execute_script("window.scrollTo({top: 0, behavior: 'instant'})")
        time.sleep(0.2)
        link = driver.find_element("css selector", f'.site-nav__link[href="{href}"]')
        link.click()
        time.sleep(0.7)
        top = driver.execute_script(
            f"return Math.round(document.getElementById('{section_id}').getBoundingClientRect().top)"
        )
        header = driver.execute_script(
            "return Math.round(document.querySelector('#chrome').getBoundingClientRect().bottom)"
        )
        print(f"{section_id}: section top={top}px, header bottom={header}px")
        assert top >= header, f"{section_id} is hidden behind the sticky header"
        assert top <= header + 40, f"{section_id} did not land below the header"
    driver.execute_script("document.documentElement.style.scrollBehavior = ''")

    # Reduced motion
    driver.execute_cdp_cmd(
        "Emulation.setEmulatedMedia",
        {"features": [{"name": "prefers-reduced-motion", "value": "reduce"}]},
    )
    driver.get(BASE + "/")
    time.sleep(1)
    motion = driver.execute_script(
        """
        const cloud = document.querySelector('.cloud');
        const scroll = getComputedStyle(document.documentElement).scrollBehavior;
        return { cloudAnimation: getComputedStyle(cloud).animationName, scroll };
        """
    )
    print("Reduced motion:", motion)
    assert motion["cloudAnimation"] == "none", "Reduced motion should disable cloud drift"
    assert motion["scroll"] == "auto", "Reduced motion should disable smooth scrolling"
    driver.execute_cdp_cmd("Emulation.setEmulatedMedia", {"features": []})

    # Small widths
    for width in (320, 360, 414, 1024):
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": 800,
                "deviceScaleFactor": 1,
                "mobile": width < 700,
            },
        )
        time.sleep(0.4)
        widths = driver.execute_script(
            "return { scroll: document.documentElement.scrollWidth, inner: window.innerWidth }"
        )
        print(f"{width}px viewport:", widths)
        assert widths["scroll"] <= widths["inner"] + 1, f"Horizontal overflow at {width}px"

    driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})

    # Internal asset / route checks
    for path in [
        "/",
        "/projects/",
        "/projects/deep-research/",
        "/projects/visualize/",
        "/projects/umkm-ecommerce/",
        "/projects/starlink-reseller/",
        "/about/",
        "/contact/",
        "/resume.pdf",
    ]:
        with urllib.request.urlopen(BASE + path, timeout=10) as response:
            print(path, response.status, response.headers.get("Content-Type"))
            assert response.status == 200

    try:
        urllib.request.urlopen(BASE + "/this-route-does-not-exist", timeout=10)
    except urllib.error.HTTPError as error:
        print("/this-route-does-not-exist", error.code, "(expected)")
        assert error.code == 404

    print("ANCHOR OFFSET, REDUCED MOTION, SMALL WIDTH, AND ASSET CHECKS PASSED")
finally:
    driver.quit()
