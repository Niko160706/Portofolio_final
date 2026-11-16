const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4321';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH;
const SHOT_DIR = process.env.B6_SHOT_DIR || 'artifacts/alter-b6';
const errors = [];

const waitForPhase = (page, phase) => page.waitForFunction((value) => {
  const raw = sessionStorage.getItem('human-protocol:alter:v1');
  return raw ? JSON.parse(raw).phase === value : false;
}, phase, { timeout: 5000 });

async function loadDebug(page) {
  await page.goto(`${BASE}?alterDebug=1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1400);
}

async function addClue(page, clue) {
  await page.getByRole('button', { name: `+${clue}` }).click();
  await page.waitForTimeout(250);
}

async function openMoro(page) {
  await page.getByRole('button', { name: 'Talk to MORO' }).first().click();
  await page.getByRole('dialog', { name: 'MORO dialogue' }).waitFor();
  return page.locator('.moro-companion__message');
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
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`desktop: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`desktop: ${error.message}`));
  await page.addInitScript(() => sessionStorage.clear());
  await loadDebug(page);

  // Scenario 1: P0 normal helpful MORO.
  let message = await openMoro(page);
  const p0Message = await message.innerText();
  if (!p0Message.includes("Hi, I'm MORO")) throw new Error(`P0 message not normal: ${p0Message}`);
  await page.keyboard.press('Escape');
  console.log('P0 normal MORO pass');

  // Scenario 2: P1 hesitation after the trace contradiction.
  await addClue(page, 'C02');
  message = await openMoro(page);
  const p1Message = await message.innerText();
  if (!p1Message.includes('trace') || !p1Message.includes('readable')) {
    throw new Error(`P1 hesitation missing: ${p1Message}`);
  }
  await page.waitForTimeout(250);
  const waitingState = await page.locator('.moro-companion').getAttribute('data-animation-state');
  await page.waitForTimeout(1800);
  const settledState = await page.locator('.moro-companion').getAttribute('data-animation-state');
  if (waitingState !== 'waiting') throw new Error(`P1 waiting state missing: ${waitingState}`);
  if (settledState === 'waiting') throw new Error('P1 waiting animation did not finish');
  await page.keyboard.press('Escape');
  console.log('P1 hesitation pass');

  // Scenario 3: direct math help must not be overwritten by ambient story.
  await page.locator('#work-visualize').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Reflect Y', exact: true }).click();
  await page.waitForTimeout(500);
  const mathGreeting = await page.locator('.moro-companion__greeting').innerText();
  if (!mathGreeting.includes('orientation flipped')) {
    throw new Error(`Math response was overwritten: ${mathGreeting}`);
  }
  console.log('math help priority pass');

  // Scenario 4: P2 redirection.
  await addClue(page, 'C01');
  await addClue(page, 'C03');
  message = await openMoro(page);
  const p2Message = await message.innerText();
  if (!p2Message.includes('Three discrepancies')) throw new Error(`P2 line missing: ${p2Message}`);
  await page.keyboard.press('Escape');
  console.log('P2 redirect pass');

  // Scenario 5: P4 MORO and ECHO voices in the terminal.
  await page.addStyleTag({ content: '[data-alter-debug]{display:none!important}' });
  await page.locator('#alter-investigate-button').click();
  await waitForPhase(page, 'P4');
  await page.waitForTimeout(300);
  let output = await runTerminal(page, 'moro');
  if (!output.includes('MORO') || !output.includes('record 005')) {
    throw new Error(`P4 MORO voice missing: ${output.slice(-400)}`);
  }
  output = await runTerminal(page, 'echo');
  if (!output.includes('ECHO') || !output.includes('Record 004')) {
    throw new Error(`P4 ECHO voice missing: ${output.slice(-400)}`);
  }
  output = await runTerminal(page, 'compare 004');
  if (!output.includes('MORO claim [record 005]') || !output.includes('ECHO record [record 004]')) {
    throw new Error(`P4 comparison grounding missing: ${output.slice(-500)}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, 'b6_p4_voices_1440x900.png') });
  console.log('P4 MORO/ECHO pass');

  // Scenario 6: P5 reconciliation voice, reached via QA debug control.
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('[data-alter-debug] button')]
      .find((item) => item.textContent === 'Reconcile');
    if (button instanceof HTMLElement) button.click();
  });
  await waitForPhase(page, 'P5');
  await page.waitForTimeout(300);
  output = await runTerminal(page, 'moro');
  if (!output.includes('Protecting a visitor') || !output.includes('unverified')) {
    throw new Error(`P5 MORO voice missing: ${output.slice(-500)}`);
  }
  await page.screenshot({ path: path.join(SHOT_DIR, 'b6_p5_reconciliation_1440x900.png') });
  console.log('P5 reconciliation pass');

  await context.close();

  // Mobile + reduced motion bubble positioning at P1.
  {
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce'
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
    await mobilePage.addInitScript(() => sessionStorage.clear());
    await mobilePage.goto(BASE, { waitUntil: 'networkidle' });
    await mobilePage.evaluate(() => document.fonts.ready);
    await mobilePage.waitForTimeout(1200);
    await mobilePage.locator('#work-deep').scrollIntoViewIfNeeded();
    await mobilePage.locator('#research-command').fill('/inspect');
    await mobilePage.locator('#research-command').press('Enter');
    await mobilePage.waitForTimeout(500);
    if (await mobilePage.locator('.anomaly-note').count()) {
      await mobilePage.locator('.anomaly-actions .retro-action').click();
      await mobilePage.waitForTimeout(200);
    }
    const mobileMessage = await openMoro(mobilePage);
    const text = await mobileMessage.innerText();
    if (!text.includes('trace')) throw new Error(`Mobile P1 message missing: ${text}`);
    const bounds = await mobilePage.locator('.moro-companion__dialogue').boundingBox();
    if (!bounds || bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > 390 || bounds.y + bounds.height > 844) {
      throw new Error(`Mobile MORO bubble outside viewport: ${JSON.stringify(bounds)}`);
    }
    await mobilePage.screenshot({ path: path.join(SHOT_DIR, 'b6_mobile_reduced_390x844.png') });
    console.log('mobile reduced-motion bubble pass');
    await mobileContext.close();
  }

  await browser.close();
  if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
  console.log('ALTER B6 MORO STORY PASSED');
})().catch((error) => {
  console.error('ALTER B6 MORO STORY FAILED');
  console.error(error);
  process.exit(1);
});
