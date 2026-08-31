/**
 * End-to-end smoke test for the playground.
 *
 * Serves the production build the same way GitHub Pages does — under the
 * `/ng-gsap/` base href, with index.html as the 404 fallback — so this also
 * verifies that deep links and the base-href config actually work, not just
 * that the animations run.
 *
 * Run with: yarn e2e   (after `yarn build:lib && yarn build:playground`)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist/playground/browser/', import.meta.url).pathname;
const BASE_PATH = '/ng-gsap';
const PORT = 4288;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  const relative = path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) : path;
  const target = normalize(relative === '/' || relative === '' ? '/index.html' : relative);
  // Prerendered routes land at <route>/index.html, which is how static hosts
  // (GitHub Pages included) resolve an extensionless path.
  const candidates = extname(target)
    ? [join(DIST, target)]
    : [join(DIST, target, 'index.html'), join(DIST, target)];

  for (const file of candidates) {
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
      return;
    } catch {
      // try the next candidate
    }
  }

  {
    // SPA fallback — exactly what pages.yml's 404.html copy does in production
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(await readFile(join(DIST, 'index.html')));
  }
});

await new Promise((resolve) => server.listen(PORT, resolve));
const BASE = `http://localhost:${PORT}${BASE_PATH}`;

const failures = [];
const consoleErrors = [];

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures.push(name);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on(
  'console',
  (m) => m.type() === 'error' && consoleErrors.push(`${page.url()} :: ${m.text()}`),
);
page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: ${e.message}`));

const box = async (selector) => (await page.locator(selector).first().boundingBox()) ?? { x: 0 };
const settle = (ms = 900) => page.waitForTimeout(ms);

try {
  // Every route renders — reached as a deep link, i.e. through the SPA fallback.
  const routes = [
    ['/', 'ng-gsap'],
    ['/docs/getting-started', 'Getting started'],
    ['/docs/api', 'API reference'],
    ['/docs/guides', 'Guides'],
    ['/basic-tween', 'Basic tween'],
    ['/timeline', 'Timeline'],
    ['/context-safe', 'Event handlers'],
    ['/scrubber', 'Two-way scrubber'],
    ['/list', 'Signal-driven list'],
    ['/scroll-progress', 'ScrollTrigger progress'],
    ['/scroll-pin', 'Pinned scroll story'],
    ['/text-reveal', 'Text reveal'],
    ['/flip-grid', 'Flip grid'],
    ['/svg-draw', 'SVG draw-in'],
  ];

  for (const [route, heading] of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const h1 = await page.locator('h1').first().innerText();
    check(`deep link ${route}`, h1 === heading, `h1="${h1}"`);
  }

  // injectGSAP re-runs when the signal it reads changes.
  await page.goto(`${BASE}/basic-tween`, { waitUntil: 'networkidle' });
  await settle(300);
  const beforeX = (await box('.box')).x;
  await page.locator('.box').click();
  await settle(1200);
  const movedBy = Math.round((await box('.box')).x - beforeX);
  check('basic tween re-runs on signal change', movedBy > 150, `moved ${movedBy}px`);

  // contextSafe handlers really do create tweens.
  await page.goto(`${BASE}/context-safe`, { waitUntil: 'networkidle' });
  await settle(700);
  const chip = page.locator('.chip').first();
  const before = await chip.evaluate((el) => getComputedStyle(el).transform);
  await chip.click();
  await settle();
  const after = await chip.evaluate((el) => getComputedStyle(el).transform);
  check('contextSafe handler animates', before !== after);

  // gsapScrub seeks the timeline, and animationSignals mirrors it back.
  await page.goto(`${BASE}/scrubber`, { waitUntil: 'networkidle' });
  await settle(400);
  const scrubBefore = (await box('.box.a')).x;
  await page.locator('input[type=range]').fill('1');
  await settle(500);
  const scrubbed = Math.round((await box('.box.a')).x - scrubBefore);
  const readout = await page.locator('.readout dd').first().innerText();
  check('gsapScrub seeks the timeline', scrubbed > 150, `moved ${scrubbed}px`);
  check('animationSignals mirrors progress', readout.startsWith('1'), `progress=${readout}`);

  // Enter/leave driven by the list signal.
  await page.goto(`${BASE}/list`, { waitUntil: 'networkidle' });
  await settle(400);
  const initial = await page.locator('.item').count();
  await page.locator('.btn-accent').click();
  await settle();
  const added = await page.locator('.item').count();
  await page.locator('.item .btn').first().click();
  await settle();
  const removed = await page.locator('.item').count();
  check(
    'list enter/leave',
    added === initial + 1 && removed === initial,
    `${initial} → ${added} → ${removed}`,
  );

  // ScrollTrigger genuinely drives signals (this is the bit jsdom cannot test).
  await page.goto(`${BASE}/scroll-progress`, { waitUntil: 'networkidle' });
  await settle(400);
  const textBefore = await page.locator('main').innerText();
  await page.mouse.wheel(0, 1400);
  await settle(600);
  const textAfter = await page.locator('main').innerText();
  check('ScrollTrigger updates signals on scroll', textBefore !== textAfter);

  // DrawSVGPlugin writes an animating dasharray.
  await page.goto(`${BASE}/svg-draw`, { waitUntil: 'domcontentloaded' });
  await settle(250);
  const dashMid = await page
    .locator('.draw-path')
    .evaluate((el) => getComputedStyle(el).strokeDasharray);
  await settle(1800);
  const dashEnd = await page
    .locator('.draw-path')
    .evaluate((el) => getComputedStyle(el).strokeDasharray);
  check(
    'DrawSVGPlugin draws the path',
    dashMid !== dashEnd && dashMid !== 'none',
    `${dashMid} → ${dashEnd}`,
  );

  // Flip reorders the grid. Compare the whole order, not just the first tile —
  // a random shuffle can legitimately leave any single position unchanged.
  await page.goto(`${BASE}/flip-grid`, { waitUntil: 'networkidle' });
  await settle(400);
  const tileOrder = () => page.locator('.tile').allInnerTexts();
  const orderBefore = await tileOrder();
  let orderAfter = orderBefore;
  for (let attempt = 0; attempt < 5 && orderAfter.join() === orderBefore.join(); attempt++) {
    await page.locator('button').first().click();
    await settle(900);
    orderAfter = await tileOrder();
  }
  check(
    'Flip reorders the grid',
    orderAfter.join() !== orderBefore.join() && orderAfter.length === orderBefore.length,
    `${orderBefore.join(',')} → ${orderAfter.join(',')}`,
  );

  // SplitText splits into per-word elements (it adds no classes, hence the tag check).
  await page.goto(`${BASE}/text-reveal`, { waitUntil: 'domcontentloaded' });
  await settle(250);
  const split = await page.evaluate(() => {
    const title = document.querySelector('.hero-title');
    return Array.from(title?.children ?? []).filter((el) => el.tagName === 'DIV').length;
  });
  check('SplitText splits the heading', split > 0, `${split} word nodes`);

  // Pinned ScrollTrigger: the panel must actually pin, and every chapter must
  // get a turn at full opacity without two ever being visible at once.
  //
  // Reached by clicking through the nav, not by deep link. A route transition
  // leaves a transform on the routed view, and any transform makes it the
  // containing block for position: fixed — which silently breaks the pin. Deep
  // linking skips the transition entirely and would miss that.
  await page.goto(`${BASE}/docs/api`, { waitUntil: 'networkidle' });
  await settle(500);
  await page.locator('nav a', { hasText: 'Pinned scroll story' }).first().click();
  await settle(800);

  const pinnedTop = await page.evaluate(() => {
    window.scrollTo(0, 900);
    return new Promise((resolve) =>
      setTimeout(() => {
        const story = document.querySelector('.story');
        resolve({
          top: Math.round(story.getBoundingClientRect().top),
          position: getComputedStyle(story).position,
        });
      }, 250),
    );
  });
  check(
    'pin survives an in-app route transition',
    pinnedTop.position === 'fixed' && pinnedTop.top >= 0 && pinnedTop.top < 200,
    `${pinnedTop.position} at top ${pinnedTop.top}`,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(300);
  const chapterCount = await page.locator('.chapter').count();
  const peaks = new Array(chapterCount).fill(0);
  let pinnedSamples = 0;
  let worstOverlap = 0;
  const scrollable = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  for (let y = 0; y <= scrollable; y += Math.max(40, Math.round(scrollable / 40))) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(40);
    const sample = await page.evaluate(() => {
      const story = document.querySelector('.story');
      const opacities = [...document.querySelectorAll('.chapter')].map((chapter) =>
        Number(getComputedStyle(chapter).opacity),
      );
      return { pinned: getComputedStyle(story).position === 'fixed', opacities };
    });
    sample.opacities.forEach((value, index) => {
      peaks[index] = Math.max(peaks[index], value);
    });
    if (sample.pinned) {
      pinnedSamples++;
    }
    worstOverlap = Math.max(
      worstOverlap,
      Math.abs(sample.opacities.reduce((total, value) => total + value, 0) - 1),
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  check('pinned section actually pins', pinnedSamples > 5, `${pinnedSamples} pinned samples`);
  check(
    'every chapter reaches full opacity',
    peaks.every((peak) => peak > 0.9),
    peaks.map((peak) => peak.toFixed(2)).join(', '),
  );
  check(
    'chapters crossfade without double-exposure',
    worstOverlap < 0.05,
    `worst |sum - 1| = ${worstOverlap.toFixed(3)}`,
  );

  // Route transitions (ng-gsap/router) — this site animates its own navigation.
  await page.goto(`${BASE}/docs/api`, { waitUntil: 'networkidle' });
  await settle(600);
  await page.locator('nav a', { hasText: 'Basic tween' }).first().click();
  // Sampled mid-transition: the incoming view should still be moving.
  await page.waitForTimeout(90);
  const midTransition = await page.evaluate(() => {
    const view = document.querySelector('router-outlet')?.nextElementSibling;
    if (!(view instanceof HTMLElement)) {
      return null;
    }
    const style = getComputedStyle(view);
    return { opacity: Number(style.opacity), transform: style.transform };
  });
  await settle(700);
  const settled = await page.evaluate(() => {
    const view = document.querySelector('router-outlet')?.nextElementSibling;
    return view instanceof HTMLElement ? Number(getComputedStyle(view).opacity) : null;
  });
  check(
    'route transition animates the incoming view',
    midTransition !== null && midTransition.opacity < 1,
    `mid-flight opacity ${midTransition?.opacity}`,
  );
  check('route transition settles at full opacity', settled === 1, `settled at ${settled}`);

  check('no console errors anywhere', consoleErrors.length === 0, consoleErrors.join(' | '));
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nAll e2e checks passed.');
