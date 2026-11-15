import time
import sys

sys.stdout.reconfigure(encoding="utf-8")

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-extensions")
options.add_argument("--window-size=1366,768")
driver = webdriver.Chrome(options=options)

try:
    driver.get("http://localhost:4321/")
    time.sleep(1.5)

    body = driver.find_element(By.TAG_NAME, "body")
    driver.execute_script("document.activeElement && document.activeElement.blur()")
    time.sleep(0.2)
    ActionChains(driver).send_keys(Keys.TAB).perform()
    time.sleep(0.2)
    first = driver.execute_script(
        "return {tag: document.activeElement.tagName, cls: document.activeElement.className, text: (document.activeElement.textContent||'').trim()}"
    )
    print("First Tab:", first)
    assert first["tag"] == "A" and "skip-link" in first["cls"]
    skip_visible = driver.execute_script(
        "return document.querySelector('.skip-link').getBoundingClientRect().top >= 0"
    )
    assert skip_visible, "Skip link should become visible on focus"

    reached = []
    for _ in range(30):
        ActionChains(driver).send_keys(Keys.TAB).perform()
        time.sleep(0.08)
        reached.append(
            driver.execute_script(
                "return {tag: document.activeElement.tagName, cls: (document.activeElement.className||'').toString().slice(0,40), text: (document.activeElement.textContent||'').trim().slice(0,40)}"
            )
        )
    for item in reached:
        print(item)
    assert any("site-nav__link" in item["cls"] for item in reached)

    # Dialog focus trap: open AN-01 and tab 8 times; focus must stay in dialog
    subtle = driver.find_element(By.CLASS_NAME, "assistant-btn-subtle")
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", subtle)
    time.sleep(0.2)
    subtle.click()
    time.sleep(0.2)
    driver.find_element(By.ID, "assistant-inspect-trigger").click()
    time.sleep(0.7)
    for _ in range(8):
        ActionChains(driver).send_keys(Keys.TAB).perform()
        time.sleep(0.05)
    inside = driver.execute_script(
        "return document.querySelector('.anomaly-dialog').contains(document.activeElement)"
    )
    print("Focus inside anomaly dialog after tabbing:", inside)
    assert inside, "Focus should remain trapped in the anomaly dialog"
    body.send_keys(Keys.ESCAPE)
    time.sleep(0.3)
    assert not driver.find_elements(By.CLASS_NAME, "anomaly-dialog")

    print("KEYBOARD / FOCUS TRAP CHECK PASSED")
finally:
    driver.quit()
