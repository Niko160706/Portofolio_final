const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4321';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const VIDEO_DIR = process.env.B3_VIDEO_DIR || 'artifacts/alter-b3-video';
const SCREENSHOT_DIR = process.env.B3_SCREENSHOT_DIR || 'artifacts/alter-b3';
const errors = [];

const readAlter = (page) => page.evaluate(() => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw) : null;
});

const waitForClue = (page, clueId) => page.waitForFunction((id) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  if (!raw) return false;
  const state = JSON.parse(raw);
  return Array.isArray(state.discoveredClues) && state.discoveredClues.some((clue) => clue.id === id);
}, clueId, { timeout: 4000 });

const waitForPhase = (page, phase) => page.waitForFunction((value) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  if (!raw) return false;
  return JSON.parse(raw).phase === value;
}, phase, { timeout: 4000 });

async function loadFresh(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

async function openMoro(page) {
  await page.getByRole('button', { name: 'Talk to MORO' }).first().click();
  await page.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
}

async function dismissAnomaly(page) {
  const note = page.locator('.anomaly-note');
  if (await note.count()) {
    await page.locator('.anomaly-actions .retro-action').click();
    await page.waitForTimeout(200);
  }
}

(async () => {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox']
  });

  // Main pointer journey with video.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`main: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`main: ${error.message}`));
  await page.addInitScript(() => sessionStorage.clear());
  await loadFresh(page);

  // C01: MORO status note.
  await openMoro(page);
  await page.getByRole('button', { name: 'MORO status note' }).click();
  await waitForClue(page, 'C01');
  console.log('C01 discovered');

  // C02: explicit research inspection.
  await page.locator('#work-deep').scrollIntoViewIfNeeded();
  await page.locator('#research-command').fill('/inspect');
  await page.locator('#research-command').press('Enter');
  await waitForClue(page, 'C02');
  console.log('C02 discovered');
  await dismissAnomaly(page);

  // C03: reflect Y then inspect orientation.
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Reflect Y', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Inspect orientation' }).click();
  await waitForClue(page, 'C03');
  console.log('C03 discovered');

  // C04: archive footnote.
  await page.locator('#work-umkm').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Archive footnote / 04' }).click();
  await waitForClue(page, 'C04');
  console.log('C04 discovered');

  // C05: contradiction query, only after C02.
  await openMoro(page);
  await page.getByRole('button', { name: 'Ask about omitted observations' }).click();
  await waitForClue(page, 'C05');
  console.log('C05 discovered');

  await page.waitForTimeout(800);
  const fiveClues = await readAlter(page);
  const fiveCategories = fiveClues
    ? new Set(fiveClues.discoveredClues.map((clue) => clue.category)).size
    : 0;
  if (!fiveClues || fiveClues.discoveredClues.length !== 5 || fiveCategories !== 5) {
    throw new Error(`Expected five unique clues, received ${JSON.stringify(fiveClues)}`);
  }

  // Duplicate clue must not create a flash.
  await openMoro(page);
  await page.getByRole('button', { name: 'MORO status note' }).click();
  await page.waitForTimeout(120);
  const duplicateFlash = await page.locator('.alter-fracture').count();
  const afterDuplicate = await readAlter(page);
  if (duplicateFlash !== 0) throw new Error('Duplicate clue triggered a fracture flash');
  if (afterDuplicate.discoveredClues.length !== 5) throw new Error('Duplicate clue changed the clue count');
  console.log('duplicate suppression pass');

  // Investigate becomes available only after three categories.
  const investigate = page.locator('#alter-investigate-button');
  if (!(await investigate.isVisible())) throw new Error('Investigate button missing at P2');
  const promptText = await page.locator('[data-alter-investigate="true"]').innerText();
  if (!promptText.includes('5 discrepancies recorded')) throw new Error('Investigate prompt count wrong');
  await investigate.click();
  await page.waitForTimeout(250);
  if (!(await page.locator('.alter-fracture').isVisible())) throw new Error('Fracture preview missing');
  if (!(await page.locator('[data-alter-reveal="true"]').isVisible())) throw new Error('Reveal bar missing');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b3_investigate_preview_1440x900.png') });
  await page.getByRole('button', { name: 'Return to site' }).click();
  await waitForPhase(page, 'P6');
  await page.waitForTimeout(300);
  if (await page.locator('.alter-fracture').count()) throw new Error('Fracture preview did not close');
  const focusTarget = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  if (focusTarget !== 'Talk to MORO') throw new Error(`Unexpected focus after exit: ${focusTarget}`);
  console.log('investigate and exit pass');

  await context.close();

  // Keyboard-only C01.
  {
    const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const keyboardPage = await keyboardContext.newPage();
    keyboardPage.on('pageerror', (error) => errors.push(`keyboard: ${error.message}`));
    await keyboardPage.addInitScript(() => sessionStorage.clear());
    await loadFresh(keyboardPage);
    await keyboardPage.getByRole('button', { name: 'Talk to MORO' }).first().focus();
    await keyboardPage.keyboard.press('Enter');
    await keyboardPage.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
    await keyboardPage.getByRole('button', { name: 'MORO status note' }).focus();
    await keyboardPage.keyboard.press('Enter');
    await waitForClue(keyboardPage, 'C01');
    console.log('keyboard clue pass');
    await keyboardContext.close();
  }

  // Touch-only C01.
  {
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', (error) => errors.push(`touch: ${error.message}`));
    await touchPage.addInitScript(() => sessionStorage.clear());
    await loadFresh(touchPage);
    await touchPage.getByRole('button', { name: 'Talk to MORO' }).first().tap();
    await touchPage.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
    await touchPage.getByRole('button', { name: 'MORO status note' }).tap();
    await waitForClue(touchPage, 'C01');
    console.log('touch clue pass');
    await touchContext.close();
  }

  // Normal CTA must not unlock the story.
  {
    const normalContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const normalPage = await normalContext.newPage();
    normalPage.on('pageerror', (error) => errors.push(`normal: ${error.message}`));
    await normalPage.addInitScript(() => sessionStorage.clear());
    await loadFresh(normalPage);
    await normalPage.getByRole('link', { name: 'Contact', exact: true }).first().click();
    await normalPage.waitForTimeout(500);
    const normalState = await readAlter(normalPage);
    if (normalState !== null) throw new Error('Normal CTA wrote Alter state');
    if (await normalPage.locator('[data-alter-investigate="true"]').count()) {
      throw new Error('Normal CTA exposed Investigate');
    }
    console.log('normal CTA isolation pass');
    await normalContext.close();
  }

  await browser.close();
  if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
  console.log('ALTER B3 CLUES PASSED');
})().catch((error) => {
  console.error('ALTER B3 CLUES FAILED');
  console.error(error);
  process.exit(1);
});
