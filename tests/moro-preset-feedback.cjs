const { chromium } = require('playwright');

/**
 * Regression test for MORO's mathematical preset feedback.
 *
 * A previous version called the sprite player with the invalid state
 * "working" for Shear X. That threw "Cannot read properties of undefined
 * (reading frames)", so the previous message stayed on screen. This test
 * verifies each preset produces the right message and no page errors.
 *
 * Run with:
 *   PORTFOLIO_BASE=http://127.0.0.1:4321 \
 *   NODE_PATH=/path/to/playwright/node_modules \
 *   node tests/moro-preset-feedback.cjs
 */

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4321';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const errors = [];

const expected = [
  ['Identity', 'Identity leaves every component exactly where it started.', 1],
  ['Rotate 45°', 'Rotation changes direction while preserving length.', 1],
  ['Shear X', 'This shear changes shape while preserving area.', 1],
  ['Reflect Y', 'The orientation flipped. Notice the negative determinant?', -1]
];

const readGreeting = (page) => page.evaluate(() => {
  const greeting = document.querySelector('.moro-companion__greeting');
  return greeting ? greeting.textContent || '' : '';
});

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  for (const [preset, message, expectedDeterminant] of expected) {
    await page.getByRole('button', { name: preset, exact: true }).click();
    await page.waitForFunction(
      (expectedMessage) => {
        const greeting = document.querySelector('.moro-companion__greeting');
        return Boolean(greeting && greeting.textContent?.includes(expectedMessage));
      },
      message,
      { timeout: 2500 }
    );
    const greeting = await readGreeting(page);
    await page.waitForTimeout(450);
    const determinantText = await page
      .locator('.vector-result-item')
      .filter({ hasText: 'Determinant' })
      .locator('strong')
      .innerText();
    const determinant = Number.parseFloat(determinantText.replace('−', '-'));
    if (determinant !== expectedDeterminant) {
      throw new Error(`Preset ${preset} produced determinant ${determinant}, expected ${expectedDeterminant}`);
    }
    console.log(`${preset} -> determinant ${determinantText}: ${greeting.trim()}`);
  }

  await context.close();
  await browser.close();

  if (errors.length) {
    throw new Error(`Console or page errors:\n${errors.join('\n')}`);
  }
  console.log('MORO PRESET FEEDBACK PASSED');
})().catch((error) => {
  console.error('MORO PRESET FEEDBACK FAILED');
  console.error(error);
  process.exit(1);
});
