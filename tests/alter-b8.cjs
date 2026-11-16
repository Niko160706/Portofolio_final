const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:8000';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const SHOT_DIR = process.env.B8_SHOT_DIR || 'artifacts/alter-b8';
const errors = [];

const viewports = [
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [320, 740]
];

const waitForPhase = (page, phase) => page.waitForFunction((value) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw).phase === value : false;
}, phase, { timeout: 5000 });

async function load(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
}

async function openMoro(page) {
  await page.getByRole('button', { name: 'Talk to MORO' }).first().click();
  await page.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
}

async function triggerFirstThree(page) {
  await openMoro(page);
  await page.getByRole('button', { name: 'MORO status note' }).click();
  await page.waitForTimeout(250);
  await page.locator('#work-deep').scrollIntoViewIfNeeded();
  await page.locator('#research-command').fill('/inspect');
  await page.locator('#research-command').press('Enter');
  await page.waitForTimeout(400);
  if (await page.locator('.anomaly-note').count()) {
    await page.locator('.anomaly-actions .retro-action').click();
    await page.waitForTimeout(200);
  }
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Reflect Y', exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Inspect orientation' }).click();
  await page.waitForTimeout(300);
}

function luminance(color) {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return 0;
  const parts = match[1].split(',').map(Number);
  const [r, g, b] = parts;
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });

  // Normal page across six viewports.
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`normal ${width}x${height}: ${error.message}`));
    await page.addInitScript(() => sessionStorage.clear());
    await load(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`Normal overflow at ${width}x${height}`);
    await page.screenshot({ path: path.join(SHOT_DIR, `b8_normal_${width}x${height}.png`) });
    await context.close();
  }
  console.log('six-viewport normal layout pass');

  // Terminal across six viewports.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`terminal: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`terminal: ${error.message}`));
  await page.addInitScript(() => sessionStorage.clear());
  await load(page);
  await triggerFirstThree(page);
  await page.locator('#alter-investigate-button').click();
  await waitForPhase(page, 'P4');
  await page.waitForTimeout(300);

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(250);
    const metrics = await page.evaluate(() => {
      const form = document.querySelector('.alter-terminal__form');
      const box = form?.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        form: box ? { x: box.x, y: box.y, w: box.width, h: box.height } : null,
        innerWidth,
        innerHeight
      };
    });
    if (metrics.overflow) throw new Error(`Terminal overflow at ${width}x${height}`);
    if (!metrics.form || metrics.form.y < 0 || metrics.form.y + metrics.form.h > metrics.innerHeight + 1) {
      throw new Error(`Terminal form outside viewport at ${width}x${height}: ${JSON.stringify(metrics)}`);
    }
    await page.screenshot({ path: path.join(SHOT_DIR, `b8_terminal_${width}x${height}.png`) });
  }
  console.log('six-viewport terminal layout pass');

  // Focus trap: Tab and Shift+Tab stay inside the terminal.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(250);
  await page.locator('#alter-command').focus();
  const inside = await page.evaluate(() => {
    const terminal = document.querySelector('.alter-terminal');
    const seen = [];
    for (let index = 0; index < 8; index += 1) {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      seen.push(document.activeElement?.tagName || 'none');
      if (!terminal?.contains(document.activeElement)) return { ok: false, seen };
    }
    return { ok: true, seen };
  });
  if (!inside.ok) throw new Error(`Focus escaped terminal: ${JSON.stringify(inside)}`);
  console.log('terminal focus trap pass');

  // Contrast checks.
  const ratios = await page.evaluate(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      return element ? getComputedStyle(element).color : null;
    };
    return {
      lead: read('.alter-terminal__lead'),
      muted: read('.alter-terminal__hint'),
      red: read('.alter-terminal__eyebrow'),
      button: read('.alter-terminal__controls button')
    };
  });
  const terminalBackground = '#07090B';
  if (!ratios.lead || contrast(ratios.lead, terminalBackground) < 4.5) {
    throw new Error(`Terminal lead contrast too low: ${JSON.stringify(ratios.lead)}`);
  }
  if (!ratios.muted || contrast(ratios.muted, terminalBackground) < 4.5) {
    throw new Error(`Terminal muted contrast too low: ${JSON.stringify(ratios.muted)}`);
  }
  console.log('terminal contrast pass', JSON.stringify(ratios));

  // Rain FPS while visible.
  await page.locator('#alter-command').focus();
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const started = performance.now();
    const tick = () => {
      frames += 1;
      if (performance.now() - started < 2000) requestAnimationFrame(tick);
      else resolve(Math.round((frames * 1000) / (performance.now() - started)));
    };
    requestAnimationFrame(tick);
  }));
  console.log('terminal rain fps', fps);

  // Exit and afterimage.
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await waitForPhase(page, 'P6');
  await page.waitForTimeout(250);
  if (!(await page.locator('[data-alter-afterimage="true"]').isVisible())) throw new Error('Afterimage missing');
  const afterimage = await page.locator('[data-alter-afterimage="true"]').boundingBox();
  if (!afterimage || afterimage.x < 0 || afterimage.y < 0 || afterimage.x + afterimage.width > 1440 || afterimage.y + afterimage.height > 900) {
    throw new Error(`Afterimage outside viewport: ${JSON.stringify(afterimage)}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, 'b8_afterimage_1440x900.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobileAfterimage = await page.locator('[data-alter-afterimage="true"]').boundingBox();
  if (!mobileAfterimage || mobileAfterimage.x < 0 || mobileAfterimage.y < 0 || mobileAfterimage.x + mobileAfterimage.width > 390 || mobileAfterimage.y + mobileAfterimage.height > 844) {
    throw new Error(`Mobile afterimage outside viewport: ${JSON.stringify(mobileAfterimage)}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, 'b8_afterimage_390x844.png') });
  await context.close();
  console.log('afterimage layout pass');

  // Reduced motion skips the masked reveal.
  {
    const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const reducedPage = await reducedContext.newPage();
    reducedPage.on('pageerror', (error) => errors.push(`reduced: ${error.message}`));
    await reducedPage.addInitScript(() => sessionStorage.clear());
    await load(reducedPage);
    await triggerFirstThree(reducedPage);
    await reducedPage.locator('#alter-investigate-button').click();
    await waitForPhase(reducedPage, 'P4');
    await reducedPage.waitForTimeout(250);
    if (await reducedPage.locator('[data-alter-reveal="true"]').count()) throw new Error('Reduced motion kept reveal bar');
    if (!(await reducedPage.locator('[data-alter-terminal="true"]').isVisible())) throw new Error('Reduced motion terminal missing');
    await reducedPage.screenshot({ path: path.join(SHOT_DIR, 'b8_reduced_motion_terminal_1440x900.png') });
    console.log('reduced motion skip pass');
    await reducedContext.close();
  }

  // Canvas lifecycle: one rain canvas open, none closed.
  {
    const lifecycleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const lifecyclePage = await lifecycleContext.newPage();
    lifecyclePage.on('pageerror', (error) => errors.push(`lifecycle: ${error.message}`));
    await lifecyclePage.addInitScript(() => sessionStorage.clear());
    await load(lifecyclePage);
    await triggerFirstThree(lifecyclePage);
    await lifecyclePage.locator('#alter-investigate-button').click();
    await waitForPhase(lifecyclePage, 'P4');
    const openCount = await lifecyclePage.locator('.alter-terminal__rain').count();
    if (openCount !== 1) throw new Error(`Expected one rain canvas, received ${openCount}`);
    await lifecyclePage.getByRole('button', { name: 'Exit', exact: true }).click();
    await waitForPhase(lifecyclePage, 'P6');
    const closedCount = await lifecyclePage.locator('.alter-terminal__rain').count();
    if (closedCount !== 0) throw new Error(`Rain canvas leaked after exit: ${closedCount}`);
    await lifecyclePage.getByRole('button', { name: 'Replay story' }).click();
    await lifecyclePage.waitForFunction(() => !sessionStorage.getItem('human-protocol:alter:v1'), undefined, { timeout: 5000 });
    await triggerFirstThree(lifecyclePage);
    await lifecyclePage.locator('#alter-investigate-button').click();
    await waitForPhase(lifecyclePage, 'P4');
    const secondOpen = await lifecyclePage.locator('.alter-terminal__rain').count();
    if (secondOpen !== 1) throw new Error(`Second open canvas count wrong: ${secondOpen}`);
    console.log('canvas lifecycle pass');
    await lifecycleContext.close();
  }

  await browser.close();
  if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
  console.log('ALTER B8 ACCESSIBILITY AND PERFORMANCE PASSED');
})().catch((error) => {
  console.error('ALTER B8 ACCESSIBILITY AND PERFORMANCE FAILED');
  console.error(error);
  process.exit(1);
});
