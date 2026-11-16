const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4321';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const SHOT_DIR = process.env.B4_SHOT_DIR || 'artifacts/alter-b4';
const errors = [];

const readAlter = (page) => page.evaluate(() => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw) : null;
});

const waitForPhase = (page, phase) => page.waitForFunction((value) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw).phase === value : false;
}, phase, { timeout: 5000 });

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
  if (await page.locator('.anomaly-note').count()) {
    await page.locator('.anomaly-actions .retro-action').click();
    await page.waitForTimeout(200);
  }
}

async function triggerFirstThree(page) {
  await openMoro(page);
  await page.getByRole('button', { name: 'MORO status note' }).click();
  await page.waitForTimeout(300);
  await page.locator('#work-deep').scrollIntoViewIfNeeded();
  await page.locator('#research-command').fill('/inspect');
  await page.locator('#research-command').press('Enter');
  await page.waitForTimeout(500);
  await dismissAnomaly(page);
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Reflect Y', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Inspect orientation' }).click();
  await page.waitForTimeout(400);
}

async function openTerminal(page) {
  const investigate = page.locator('#alter-investigate-button');
  await investigate.waitFor();
  await investigate.click();
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox']
  });

  // Desktop reveal and terminal.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`desktop: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`desktop: ${error.message}`));
  await page.addInitScript(() => sessionStorage.clear());
  await loadFresh(page);
  if (await page.locator('[data-alter-terminal="true"]').count()) {
    throw new Error('Terminal mounted before Investigate');
  }
  await triggerFirstThree(page);
  await openTerminal(page);
  await page.waitForTimeout(250);
  if (!(await page.locator('.alter-fracture').isVisible())) throw new Error('Reveal fracture missing');
  await page.screenshot({ path: path.join(SHOT_DIR, 'b4_reveal_p3_1440x900.png') });
  await waitForPhase(page, 'P4');
  await page.waitForTimeout(300);
  const terminal = page.locator('[data-alter-terminal="true"]');
  if (!(await terminal.isVisible())) throw new Error('Terminal missing at P4');
  if ((await terminal.getAttribute('data-reveal')) !== 'false') throw new Error('Terminal still masked at P4');
  if (!(await page.getByRole('button', { name: 'Exit', exact: true }).isVisible())) {
    throw new Error('Terminal Exit missing');
  }
  if (!(await page.getByRole('button', { name: /^Motion:/ }).isVisible())) {
    throw new Error('Terminal Motion control missing');
  }
  const canvasCount = await page.locator('.alter-terminal__rain').count();
  if (canvasCount !== 1) throw new Error(`Expected one rain canvas, received ${canvasCount}`);
  const canvasSize = await page.locator('.alter-terminal__rain').evaluate((element) => {
    const canvas = element;
    return { width: canvas.width, height: canvas.height, hasContext: Boolean(canvas.getContext('2d')) };
  });
  if (!canvasSize.hasContext || canvasSize.width < 100 || canvasSize.height < 100) {
    throw new Error(`Rain canvas invalid: ${JSON.stringify(canvasSize)}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, 'b4_terminal_1440x900.png') });

  // B5 authored command surface.
  const commandInput = page.locator('#alter-command');
  const output = page.locator('.alter-terminal__output');
  const runCommand = async (value) => {
    await commandInput.fill(value);
    await commandInput.press('Enter');
    await page.waitForTimeout(180);
  };
  await runCommand('help');
  if (!(await output.innerText()).includes('AUTHORED COMMAND SURFACE')) throw new Error('help output missing');
  await runCommand('trace list');
  if (!(await output.innerText()).includes('TRACE INDEX')) throw new Error('trace list output missing');
  await page.screenshot({ path: path.join(SHOT_DIR, 'b5_trace_list_1440x900.png') });
  await runCommand('trace inspect 004');
  if (!(await output.innerText()).includes('Omitted observations')) throw new Error('trace inspect output missing');
  await page.screenshot({ path: path.join(SHOT_DIR, 'b5_trace_inspect_1440x900.png') });
  await runCommand('compare 004');
  if (!(await output.innerText()).includes('MORO claim:')) throw new Error('compare output missing');
  await page.screenshot({ path: path.join(SHOT_DIR, 'b5_trace_compare_1440x900.png') });
  await runCommand('hash inspect 004');
  if (!(await output.innerText()).match(/[0-9a-f]{64}/)) throw new Error('hash output missing');
  await runCommand('trace inspect 004; rm -rf /');
  if (!(await output.innerText()).includes('command rejected')) throw new Error('unsafe command was not rejected');
  await runCommand('whoami');
  if (!(await output.innerText()).includes('unknown command')) throw new Error('unknown command handling missing');
  await runCommand('echo');
  if (!(await output.innerText()).includes('ECHO:')) throw new Error('ECHO voice missing');
  console.log('B5 command surface pass');

  // Resize while the terminal is open; the rain canvas must resize with it.
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(350);
  const resizedCanvas = await page.locator('.alter-terminal__rain').evaluate((canvas) => ({
    width: canvas.width,
    height: canvas.height
  }));
  if (resizedCanvas.width < 100 || resizedCanvas.height < 100) {
    throw new Error(`Rain canvas did not resize: ${JSON.stringify(resizedCanvas)}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(350);

  // Rain is moving while visible, and pauses when the document is hidden.
  const rainCanvas = page.locator('.alter-terminal__rain');
  const firstRainFrame = await rainCanvas.evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(350);
  const movingRainFrame = await rainCanvas.evaluate((canvas) => canvas.toDataURL());
  if (firstRainFrame === movingRainFrame) throw new Error('Rain canvas is not moving');
  const hiddenOverride = await page.evaluate(() => {
    try {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      return document.hidden;
    } catch {
      return false;
    }
  });
  if (!hiddenOverride) throw new Error('Could not emulate hidden document');
  const pausedRainA = await rainCanvas.evaluate((canvas) => canvas.toDataURL());
  await page.waitForTimeout(400);
  const pausedRainB = await rainCanvas.evaluate((canvas) => canvas.toDataURL());
  if (pausedRainA !== pausedRainB) throw new Error('Rain did not pause while hidden');
  console.log('rain movement and hidden pause pass');

  // Motion toggle.
  const motionButton = page.getByRole('button', { name: /^Motion:/ });
  await motionButton.click();
  await page.waitForTimeout(200);
  if (!(await motionButton.innerText()).includes('Off')) throw new Error('Motion toggle failed');

  // The exit command closes the terminal and restores focus.
  await runCommand('exit');
  await waitForPhase(page, 'P6');
  await page.waitForTimeout(300);
  if (await page.locator('[data-alter-terminal="true"]').count()) throw new Error('Terminal did not exit');
  const focus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  if (focus !== 'Talk to MORO') throw new Error(`Focus not restored: ${focus}`);
  console.log('desktop reveal, terminal, motion, escape pass');
  await context.close();

  // Mobile terminal.
  {
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
    await mobilePage.addInitScript(() => sessionStorage.clear());
    await loadFresh(mobilePage);
    await triggerFirstThree(mobilePage);
    await openTerminal(mobilePage);
    await waitForPhase(mobilePage, 'P4');
    await mobilePage.waitForTimeout(300);
    const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (mobileOverflow) throw new Error('Mobile terminal overflow');
    if (!(await mobilePage.getByRole('button', { name: 'Exit', exact: true }).isVisible())) {
      throw new Error('Mobile Exit missing');
    }
    await mobilePage.screenshot({ path: path.join(SHOT_DIR, 'b4_terminal_390x844.png') });
    await mobilePage.keyboard.press('Escape');
    await waitForPhase(mobilePage, 'P6');
    if (await mobilePage.locator('[data-alter-terminal="true"]').count()) {
      throw new Error('Mobile Escape did not close the terminal');
    }
    console.log('mobile terminal and Escape pass');
    await mobileContext.close();
  }

  // Reduced motion.
  {
    const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    reducedPage.on('pageerror', (error) => errors.push(`reduced: ${error.message}`));
    await reducedPage.addInitScript(() => sessionStorage.clear());
    await loadFresh(reducedPage);
    await triggerFirstThree(reducedPage);
    await openTerminal(reducedPage);
    await reducedPage.getByRole('button', { name: 'Skip reveal' }).click();
    await waitForPhase(reducedPage, 'P4');
    await reducedPage.waitForTimeout(400);
    const motionState = await reducedPage.locator('[data-alter-terminal="true"]').getAttribute('data-motion');
    if (motionState !== 'false') throw new Error('Reduced-motion terminal still animated');
    await reducedPage.screenshot({ path: path.join(SHOT_DIR, 'b4_terminal_reduced_motion_1440x900.png') });
    console.log('reduced motion pass');
    await reducedContext.close();
  }

  // Canvas fallback: terminal content must remain readable.
  {
    const fallbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const fallbackPage = await fallbackContext.newPage();
    fallbackPage.on('pageerror', (error) => errors.push(`fallback: ${error.message}`));
    await fallbackPage.addInitScript(() => sessionStorage.clear());
    await loadFresh(fallbackPage);
    await triggerFirstThree(fallbackPage);
    await fallbackPage.evaluate(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await openTerminal(fallbackPage);
    await waitForPhase(fallbackPage, 'P4');
    await fallbackPage.waitForTimeout(300);
    if (!(await fallbackPage.getByText('The surface has opened.')).isVisible()) {
      throw new Error('Canvas fallback lost terminal content');
    }
    await fallbackPage.screenshot({ path: path.join(SHOT_DIR, 'b4_terminal_canvas_fallback_1440x900.png') });
    console.log('canvas fallback pass');
    await fallbackContext.close();
  }

  await browser.close();
  if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
  console.log('ALTER B4/B5 TERMINAL PASSED');
})().catch((error) => {
  console.error('ALTER B4/B5 TERMINAL FAILED');
  console.error(error);
  process.exit(1);
});
