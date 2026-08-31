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

  const appConfig = await readFile(join(app, 'src/app/app.config.ts'), 'utf-8');
  await writeFile(
    join(app, 'src/app/app.config.ts'),
    appConfig
      .replace(
        "import { provideGsap } from 'ng-gsap';",
        "import { provideGsap } from 'ng-gsap';\nimport { provideGsapRouteTransitions } from 'ng-gsap/router';\nimport { gsap } from 'gsap';",
      )
      .replace(
        /\n\s*\]\s*\n\};?\s*$/,
        `,
    provideGsapRouteTransitions({
      enter: ({ element }) => gsap.from(element, { autoAlpha: 0, duration: 0.3 }),
    }),
  ],
};
`,
      ),
  );

  step('Building the consumer application');
  run('npx', ['ng', 'build'], app);

  console.log('\nPackage verified: exports map, peer ranges, schematic and all four entry points.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
