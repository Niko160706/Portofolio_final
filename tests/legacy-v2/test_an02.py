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
    driver.get("http://localhost:4321/")
    time.sleep(1.4)

    trace_button = driver.find_element(By.ID, "trace-inspect-trigger")
    driver.execute_script(
        "arguments[0].scrollIntoView({behavior:'instant', block:'center'});", trace_button
    )
    time.sleep(0.3)
    trace_button.click()
    time.sleep(0.7)

    dialog = driver.find_element(By.CLASS_NAME, "anomaly-dialog")
    assert dialog.is_displayed(), "AN-02 dialog should be visible"
    body = dialog.find_element(By.CLASS_NAME, "anomaly-body").text
    print("AN-02 body:", body)
    assert "Discrepancy detected. Response framing updated." in body

    dialog.find_element(By.CLASS_NAME, "anomaly-btn").click()
    time.sleep(0.4)

    console_line = driver.find_element(By.CLASS_NAME, "console-anomaly")
    assert console_line.is_displayed(), "Reassurance protocol line should remain in the console"
    print("AN-02 console line:", console_line.text)
    assert "REASSURANCE_PROTOCOL: ACTIVE" in console_line.text

    print("AN-02 DEEP RESEARCH TRACE CHECK PASSED")
finally:
    driver.quit()
