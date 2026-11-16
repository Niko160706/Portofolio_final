const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:8000';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const SHOT_DIR = process.env.B7_SHOT_DIR || 'artifacts/alter-b7';
const errors = [];

const readAlter = (page) => page.evaluate(() => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw) : null;
});

const waitForPhase = (page, phase) => page.waitForFunction((value) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw).phase === value : false;
}, phase, { timeout: 5000 });

async function load(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

async function openMoro(page) {
  await page.getByRole('button', { name: 'Talk to MORO' }).first().click();
  await page.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
}

async function triggerFirstThree(page) {
  await openMoro(page);
  await page.getByRole('button', { name: 'MORO status note' }).click();
  await page.waitForTimeout(300);
  await page.locator('#work-deep').scrollIntoViewIfNeeded();
  await page.locator('#research-command').fill('/inspect');
  await page.locator('#research-command').press('Enter');
  await page.waitForTimeout(500);
  if (await page.locator('.anomaly-note').count()) {
    await page.locator('.anomaly-actions .retro-action').click();
    await page.waitForTimeout(200);
  }
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Reflect Y', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Inspect orientation' }).click();
  await page.waitForTimeout(350);
}

async function runTerminal(page, value) {
  const input = page.locator('#alter-command');
  await input.fill(value);
  await input.press('Enter');
  await page.waitForTimeout(200);
  return page.locator('.alter-terminal__output').innerText();
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });

  // Desktop full journey.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`desktop: ${message.text()}`); });
    page.on('pageerror', (error) => errors.push(`desktop: ${error.message}`));
    await page.addInitScript(() => sessionStorage.clear());
    await load(page);
    await triggerFirstThree(page);
    const scrollBeforeTerminal = await page.evaluate(() => window.scrollY);
    await page.locator('#alter-investigate-button').click();
    await waitForPhase(page, 'P4');
    await page.waitForTimeout(300);
    await runTerminal(page, 'trace inspect 004');
    await runTerminal(page, 'compare 004');
    await runTerminal(page, 'reconcile');
    await waitForPhase(page, 'P5');
    await page.waitForTimeout(250);
    if (!(await page.locator('.alter-terminal__resolution').isVisible())) {
      throw new Error('P5 resolution panel missing');
    }
    await page.screenshot({ path: path.join(SHOT_DIR, 'b7_reconciliation_1440x900.png') });
    await page.getByRole('button', { name: 'Exit', exact: true }).click();
    await waitForPhase(page, 'P6');
    await page.waitForTimeout(300);
    if (!(await page.locator('[data-alter-afterimage="true"]').isVisible())) {
      throw new Error('P6 afterimage missing');
    }
    const focus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (focus !== 'Talk to MORO') throw new Error(`Exit focus not restored: ${focus}`);
    const scrollAfterExit = await page.evaluate(() => window.scrollY);
    if (Math.abs(scrollAfterExit - scrollBeforeTerminal) > 1) throw new Error('Scroll changed during terminal');
    await page.screenshot({ path: path.join(SHOT_DIR, 'b7_afterimage_1440x900.png') });
    await page.getByRole('button', { name: 'Replay story' }).click();
    await page.waitForFunction(() => !sessionStorage.getItem('human-protocol:alter:v1'), undefined, { timeout: 5000 });
    await page.waitForFunction(() => window.scrollY === 0, undefined, { timeout: 12000 });
    await page.waitForTimeout(200);
    const state = await readAlter(page);
    if (state !== null) throw new Error('Replay did not clear Alter session');
    if (await page.locator('[data-alter-afterimage="true"]').count()) throw new Error('Afterimage survived replay');
    if (await page.locator('[data-alter-investigate="true"]').count()) throw new Error('Investigate survived replay');
    const replayFocus = await page.evaluate(() => document.activeElement?.className);
    if (!replayFocus || !replayFocus.includes('brand')) throw new Error(`Replay focus missing: ${replayFocus}`);
    if (await page.evaluate(() => window.scrollY) !== 0) throw new Error('Replay did not return to top');
    console.log('desktop full journey pass');
    await context.close();
  }

  // Mobile touch journey.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
    await page.addInitScript(() => sessionStorage.clear());
    await load(page);
    await triggerFirstThree(page);
    await page.locator('#alter-investigate-button').tap();
    await waitForPhase(page, 'P4');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Exit', exact: true }).tap();
    await waitForPhase(page, 'P6');
    await page.waitForTimeout(250);
    if (!(await page.locator('[data-alter-afterimage="true"]').isVisible())) throw new Error('Mobile afterimage missing');
    await page.getByRole('button', { name: 'Replay story' }).tap();
    await page.waitForFunction(() => !sessionStorage.getItem('human-protocol:alter:v1'), undefined, { timeout: 5000 });
    console.log('mobile touch journey pass');
    await context.close();
  }

  // Keyboard-only journey.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`keyboard: ${error.message}`));
    await page.addInitScript(() => sessionStorage.clear());
    await load(page);
    // C01
    await page.getByRole('button', { name: 'Talk to MORO' }).first().focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
    await page.getByRole('button', { name: 'MORO status note' }).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    // C02
    await page.locator('#work-deep').scrollIntoViewIfNeeded();
    await page.locator('#research-command').focus();
    await page.keyboard.type('/inspect');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    if (await page.locator('.anomaly-note').count()) {
      await page.locator('.anomaly-actions .retro-action').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    // C03
    await page.locator('#work-visualize').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Reflect Y', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Inspect orientation' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.locator('#alter-investigate-button').focus();
    await page.keyboard.press('Enter');
    await waitForPhase(page, 'P4');
    await page.waitForTimeout(250);
    await page.locator('#alter-command').focus();
    await page.keyboard.type('reconcile');
    await page.keyboard.press('Enter');
    await waitForPhase(page, 'P5');
    await page.waitForTimeout(250);
    if (!(await page.locator('.alter-terminal__resolution').isVisible())) throw new Error('Keyboard P5 resolution missing');
    await page.keyboard.press('Escape');
    await waitForPhase(page, 'P6');
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Replay story' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !sessionStorage.getItem('human-protocol:alter:v1'), undefined, { timeout: 5000 });
    await page.waitForFunction(() => document.activeElement?.className?.includes('brand'), undefined, { timeout: 3000 });
    const replayFocus = await page.evaluate(() => document.activeElement?.className);
    if (!replayFocus || !replayFocus.includes('brand')) throw new Error(`Keyboard replay focus missing: ${replayFocus}`);
    console.log('keyboard-only journey pass');
    await context.close();
  }

  await browser.close();
  if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
  console.log('ALTER B7 FULL JOURNEY PASSED');
})().catch((error) => {
  console.error('ALTER B7 FULL JOURNEY FAILED');
  console.error(error);
  process.exit(1);
});
