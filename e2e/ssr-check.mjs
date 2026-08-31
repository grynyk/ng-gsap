/**
 * Verifies the prerendered (SSR) output.
 *
 * The playground is built with `outputMode: "static"`, so every route is
 * rendered in Node with no DOM. That alone proves ng-gsap doesn't touch the
 * DOM on the server — the build would throw otherwise. This script additionally
 * checks that the server output is *correct*: real content in the HTML, and no
 * animation side effects baked into it.
 *
 * Run with: yarn verify:ssr   (after `yarn build:playground`)
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/playground/browser/', import.meta.url).pathname;

const EXPECTED_ROUTES = [
  ['', 'ng-gsap'],
  ['docs/getting-started', 'Getting started'],
  ['docs/api', 'API reference'],
  ['docs/guides', 'Guides'],
  ['basic-tween', 'Basic tween'],
  ['timeline', 'Timeline'],
  ['context-safe', 'Event handlers'],
  ['scrubber', 'Two-way scrubber'],
  ['list', 'Signal-driven list'],
  ['scroll-progress', 'ScrollTrigger progress'],
  ['scroll-pin', 'Pinned scroll story'],
  ['text-reveal', 'Text reveal'],
  ['flip-grid', 'Flip grid'],
  ['svg-draw', 'SVG draw-in'],
];

/**
 * GSAP's fingerprint in serialised HTML.
 *
 * It is deliberately not "any inline transform": components legitimately bind
 * `[style.transform]` from a signal, and rendering that initial state on the
 * server is the whole point of SSR. What GSAP specifically does is write a
 * transform reset preamble before the transform itself, plus tag the element
 * with its own cache key. Neither can come from an ordinary Angular binding.
 */
const GSAP_ARTEFACTS = [/translate:\s*none;\s*rotate:\s*none;\s*scale:\s*none/i, /_gsap/];

/** Only inline style attributes — CSS inside <style> blocks is not a side effect. */
function inlineStyles(html) {
  return [...html.matchAll(/style="([^"]*)"/gi)].map((match) => match[1]).join(' | ');
}

const failures = [];

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) {
    failures.push(name);
  }
}

const entries = await readdir(DIST, { withFileTypes: true });
const prerenderedDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

for (const [route, heading] of EXPECTED_ROUTES) {
  const file = join(DIST, route, 'index.html');
  let html;

  try {
    html = await readFile(file, 'utf8');
  } catch {
    check(`prerendered /${route}`, false, 'no index.html emitted');
    continue;
  }

  const hasHeading = html.includes(`>${heading}<`);
  const styles = inlineStyles(html);
  const artefact = GSAP_ARTEFACTS.find((pattern) => pattern.test(styles) || pattern.test(html));

  check(`prerendered /${route || '(root)'}`, hasHeading, `${html.length} bytes`);
  check(
    `/${route || '(root)'} ran no animations on the server`,
    !artefact,
    artefact ? `matched ${artefact}` : '',
  );
}

check(
  'every route was prerendered',
  EXPECTED_ROUTES.filter(([r]) => r && !r.includes('/')).every((r) =>
    prerenderedDirs.includes(r[0]),
  ),
  prerenderedDirs.join(', '),
);

if (failures.length) {
  console.error(`\n${failures.length} SSR check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nAll SSR checks passed.');
