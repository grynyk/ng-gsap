/**
 * Verifies the package the way a stranger would consume it.
 *
 * Packs dist/ng-gsap, generates a throwaway Angular app, installs the tarball,
 * runs `ng add ng-gsap`, imports all four entry points, and builds. This is the
 * only check that exercises the published exports map, the peer dependency
 * ranges, and the schematic — none of which internal builds can catch, because
 * internally everything resolves through tsconfig path mappings instead.
 *
 * Run with: yarn verify:package   (after `yarn build:lib`)
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = await mkdtemp(join(tmpdir(), 'ng-gsap-verify-'));
// A dedicated cache keeps this independent of the machine's npm cache state.
const env = { ...process.env, npm_config_cache: join(workspace, 'npm-cache') };

const run = (command, args, cwd) =>
  execFileSync(command, args, { cwd, env, stdio: 'inherit', encoding: 'utf-8' });

function step(message) {
  console.log(`\n── ${message}`);
}

try {
  step('Packing dist/ng-gsap');
  run('npm', ['pack', './dist/ng-gsap', '--pack-destination', workspace], root);
  const { version } = JSON.parse(await readFile(join(root, 'dist/ng-gsap/package.json'), 'utf-8'));
  const tarball = join(workspace, `ng-gsap-${version}.tgz`);

  step('Generating a fresh Angular application');
  run(
    'npx',
    [
      '--yes',
      '@angular/cli@22',
      'new',
      'consumer',
      '--skip-git',
      '--skip-tests',
      '--style=scss',
      '--ssr=false',
      '--defaults',
      '--package-manager=npm',
    ],
    workspace,
  );
  const app = join(workspace, 'consumer');

  step('Installing the tarball');
  run('npm', ['install', tarball], app);

  step('Running the ng-add schematic');
  run('npx', ['ng', 'generate', 'ng-gsap:ng-add', '--plugins', '--defaults'], app);

  const config = await readFile(join(app, 'src/app/app.config.ts'), 'utf-8');
  for (const expected of ['provideGsap', "from 'ng-gsap'", 'ScrollTrigger']) {
    if (!config.includes(expected)) {
      throw new Error(`ng-add did not write ${expected} into app.config.ts`);
    }
  }
  console.log('   ng-add wrote provideGsap() and its imports');

  step('Importing every entry point');
  await writeFile(
    join(app, 'src/app/app.ts'),
    `import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { animationSignals, gsapScrub, injectGSAP } from 'ng-gsap';
import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';
import { advanceGsap, provideGsapTesting } from 'ng-gsap/testing';

// The testing entry point is meant for specs, but the consumer app has none;
// referencing it here still proves the export resolves and type-checks.
export const testingTools = [advanceGsap, provideGsapTesting];

@Component({
  selector: 'app-root',
  template: \`<div #container><div class="box"></div></div>
    <p>{{ scroll.progress() }}{{ playback.isActive() }}{{ progress() }}</p>\`,
})
export class App {
  private container = viewChild.required<ElementRef>('container');
  protected open = signal(false);
  private timeline = gsap.timeline({ paused: true });
  protected progress = gsapScrub(this.timeline);
  protected playback = animationSignals(this.timeline, { killOnDestroy: false });
  protected scroll = injectScrollTrigger({ trigger: this.container });

  constructor() {
    injectGSAP(() => { gsap.to('.box', { x: this.open() ? 220 : 0 }); }, { scope: this.container });
  }
}
`,
  );

  // The generated config's exact shape is the CLI's business. Editing its
  // providers array by string surgery once silently no-op'd, which left this
  // entry point unverified while the script still reported success. A sibling
  // export resolves ng-gsap/router against the published exports map and
  // types regardless of how the CLI lays the file out.
  const appConfig = await readFile(join(app, 'src/app/app.config.ts'), 'utf-8');
  await writeFile(
    join(app, 'src/app/app.config.ts'),
    `${appConfig}
import { provideGsapRouteTransitions } from 'ng-gsap/router';
import { gsap as gsapCore } from 'gsap';

export const routeTransitions = provideGsapRouteTransitions({
  enter: ({ element }) => gsapCore.from(element, { autoAlpha: 0, duration: 0.3 }),
});
`,
  );

  step('Building the consumer application');
  run('npx', ['ng', 'build'], app);

  console.log('\nPackage verified: exports map, peer ranges, schematic and all four entry points.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
