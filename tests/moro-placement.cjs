const { chromium } = require('playwright');

/**
 * Regression test for MORO placement.
 *
 * The companion is a fixed-position element driven by viewport coordinates.
 * This test guards the two failure modes found during review:
 *   1. anchoring to the Visualize row while that row is still below the fold,
 *   2. leaving floating mode after a viewport resize or mobile URL-bar change.
 *
 * Run with:
 *   PORTFOLIO_BASE=http://127.0.0.1:4321 \
 *   NODE_PATH=/path/to/playwright/node_modules \
 *   node tests/moro-placement.cjs
 */

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4321';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const errors = [];

const readMoro = (page) => page.evaluate(() => {
  const root = document.querySelector('.moro-companion');
  if (!root) return null;
  const rect = root.getBoundingClientRect();
  return {
    mode: root.dataset.mode,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
});

const assertInside = (rect, label) => {
  if (!rect) throw new Error(`MORO is missing (${label})`);
  const tolerance = 2;
  if (
    rect.x < -tolerance ||
    rect.y < -tolerance ||
    rect.x + rect.width > rect.viewportWidth + tolerance ||
    rect.y + rect.height > rect.viewportHeight + tolerance
  ) {
    throw new Error(`MORO is outside the viewport (${label}): ${JSON.stringify(rect)}`);
  }
};

async function checkViewport(browser, width, height, isMobile) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${width}x${height}: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`${width}x${height}: ${error.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.moro-companion[data-positioned="true"]');
  await page.waitForTimeout(1600);

  let moro = await readMoro(page);
  assertInside(moro, `${width}x${height} top`);
  if (moro.mode !== 'hero') throw new Error(`Expected hero mode at top on ${width}px`);

  // The Visualize anchor is below the fold at 2400/3000; it must not be used
  // until the full sprite can fit on screen.
  const expectations = [
    [0, 'hero'],
    [1200, 'floating'],
    [2400, 'floating'],
    [3000, 'floating'],
    [3400, 'visualize'],
    [3600, 'visualize'],
    [6000, 'floating'],
    [0, 'hero']
  ];

  for (const [scrollTop, expectedMode] of expectations) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scrollTop);
    await page.waitForTimeout(1200);
    moro = await readMoro(page);
    assertInside(moro, `${width}x${height} scroll ${scrollTop}`);
    if (moro.mode !== expectedMode) {
      throw new Error(
        `Expected ${expectedMode} at scroll ${scrollTop} on ${width}px; received ${moro.mode}`
      );
    }
  }

  // Rapid scroll must never push the sprite outside the viewport.
  const samples = [];
  const startedAt = Date.now();
  let index = 0;
  while (Date.now() - startedAt < 2200) {
    const positions = [0, 2400, 3400, 6000];
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: 'instant' }),
      positions[index % positions.length]
    );
    await page.waitForTimeout(24);
    samples.push(await readMoro(page));
    index += 1;
  }
  samples.forEach((sample, sampleIndex) => {
    assertInside(sample, `${width}x${height} rapid sample ${sampleIndex}`);
  });

  // Resizing while floating must recompute the dock position.
  await page.evaluate(() => window.scrollTo({ top: 6000, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(600);
  moro = await readMoro(page);
  assertInside(moro, `${width}x${height} resize 800x600`);

  await page.setViewportSize({ width, height });
  await page.waitForTimeout(600);
  moro = await readMoro(page);
  assertInside(moro, `${width}x${height} resize back`);

  await context.close();
  console.log(`MORO placement PASS at ${width}x${height}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox']
  });

  await checkViewport(browser, 1440, 900, false);
  await checkViewport(browser, 390, 844, true);

  await browser.close();

  if (errors.length) {
    throw new Error(`Console or page errors:\n${errors.join('\n')}`);
  }
  console.log('MORO PLACEMENT REGRESSION PASSED');
})().catch((error) => {
  console.error('MORO PLACEMENT REGRESSION FAILED');
  console.error(error);
  process.exit(1);
});
