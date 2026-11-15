import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-extensions')
options.add_argument('--hide-scrollbars')
options.add_argument('--window-size=1440,900')
driver = webdriver.Chrome(options=options)

try:
    os.makedirs(r'C:\Users\niko\Videos\Portofolio_final\artifacts', exist_ok=True)
    driver.get('http://localhost:4321/')
    time.sleep(1)

    # 1. Console Errors Check
    logs = driver.get_log('browser')
    severe = [l for l in logs if l['level'] == 'SEVERE']
    print('Severe Console Errors:', severe)
    assert len(severe) == 0, 'Console errors encountered'

    # 2. Viewport Screenshots at Requested Dimensions
    viewports = [
        ('1440x900', 1440, 900),
        ('1366x768', 1366, 768),
        ('768x1024', 768, 1024),
        ('390x844', 390, 844)
    ]

    for name, w, h in viewports:
        driver.execute_cdp_cmd(
            'Emulation.setDeviceMetricsOverride',
            {'width': w, 'height': h, 'deviceScaleFactor': 1, 'mobile': w < 500}
        )
        time.sleep(0.6)
        path = rf'C:\Users\niko\Videos\Portofolio_final\artifacts\editorial_{name}.png'
        driver.save_screenshot(path)
        print(f'Screenshot captured at {name} -> {path}')
        driver.execute_cdp_cmd('Emulation.clearDeviceMetricsOverride', {})

    # Reset to 1440x900 for interaction tests
    driver.set_window_size(1440, 900)
    time.sleep(0.3)

    # 3. Test Hard Requirement: Vertical Document Scrolling
    scroll_height = driver.execute_script("return document.documentElement.scrollHeight;")
    inner_height = driver.execute_script("return window.innerHeight;")
    print(f'Document Scroll Height: {scroll_height}px | Viewport Height: {inner_height}px')
    assert scroll_height > inner_height * 2, 'Page must be vertically scrollable through independent sections'

    # Test scrolling to each section
    sections = ['selected-work', 'research-lab', 'how-i-work', 'about-experience', 'contact-channels']
    for sec_id in sections:
        driver.execute_script(f"document.getElementById('{sec_id}').scrollIntoView();")
        time.sleep(0.3)
        y_offset = driver.execute_script("return window.pageYOffset;")
        print(f'Scrolled to #{sec_id}: pageYOffset = {y_offset}px')
        assert y_offset > 0, f'Scroll offset should be positive when navigating to #{sec_id}'

    # 4. Test AN-01 Assistant in Hero
    what_is_this_btn = driver.find_element(By.CLASS_NAME, 'assistant-btn-subtle')
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", what_is_this_btn)
    time.sleep(0.5)
    what_is_this_btn.click()
    time.sleep(0.3)

    inspect_btn = driver.find_element(By.ID, 'assistant-inspect-trigger')
    inspect_btn.click()
    time.sleep(0.8)

    anomaly_dialog = driver.find_element(By.CLASS_NAME, 'anomaly-dialog')
    assert anomaly_dialog.is_displayed()
    body_text = anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-body').text
    print('AN-01 Message:', body_text)
    assert 'Maintain the friendly interface' in body_text
    anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-btn').click()
    time.sleep(0.3)

    # 5. Test AN-02 Deep Research Telemetry Trace
    trace_btn = driver.find_element(By.ID, 'trace-inspect-trigger')
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", trace_btn)
    time.sleep(0.5)
    trace_btn.click()
    time.sleep(0.8)

    anomaly_dialog = driver.find_element(By.CLASS_NAME, 'anomaly-dialog')
    assert anomaly_dialog.is_displayed()
    body_text = anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-body').text
    print('AN-02 Message:', body_text)
    assert 'Discrepancy detected. Response framing updated.' in body_text
    anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-btn').click()
    time.sleep(0.3)

    # 6. Test AN-03 Research Lab Hidden Files
    lab_sec = driver.find_element(By.ID, 'research-lab')
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'start'});", lab_sec)
    time.sleep(0.5)

    view_btns = driver.find_elements(By.CLASS_NAME, 'explorer-menu-btn')
    for b in view_btns:
        if b.text == 'View':
            b.click()
            break
    time.sleep(0.3)

    checkbox = driver.find_element(By.CSS_SELECTOR, '.dropdown-check-item input[type="checkbox"]')
    checkbox.click()
    time.sleep(0.3)

    hidden_log = driver.find_element(By.CLASS_NAME, 'hidden-log-item')
    assert hidden_log.is_displayed()
    driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", hidden_log)
    time.sleep(0.3)
    hidden_log.find_element(By.TAG_NAME, "button").click()
    time.sleep(0.8)

    anomaly_dialog = driver.find_element(By.CLASS_NAME, 'anomaly-dialog')
    assert anomaly_dialog.is_displayed()
    body_text = anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-body').text
    print('AN-03 Message:', body_text)
    assert 'Who decides what you are allowed to see?' in body_text
    anomaly_dialog.find_element(By.CLASS_NAME, 'anomaly-btn').click()
    time.sleep(0.3)

    # 7. Test AN-04 Diagnostics Window (Start menu)
    start_btn = driver.find_element(By.ID, 'taskbar-start-button')
    start_btn.click()
    time.sleep(0.3)
    diag_btn = driver.find_element(By.ID, 'start-menu-diagnostics')
    diag_btn.click()
    time.sleep(0.5)

    diag_text = driver.find_element(By.CLASS_NAME, 'diagnostics-terminal').text
    print('AN-04 Terminal text snippet:', diag_text[:160])
    assert 'ASSISTANT: Everything is operating normally.' in diag_text
    assert 'UNKNOWN: That is what the interface was instructed to say.' in diag_text
    print('AN-04 Verified!')

    print('\nALL V2 EDITORIAL × RETRO COMPUTING BROWSER E2E TESTS PASSED!')
finally:
    driver.quit()
