import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { chain } from '@angular-devkit/schematics';
import {
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
  addDependency,
  addRootProvider,
} from '@schematics/angular/utility';
import type { NgAddOptions } from './schema';

/** Kept in step with the `gsap` peer range in the package manifest. */
const GSAP_RANGE = '^3.12.0';

function readVersion(tree: Tree): string {
  const manifest = tree.read('/package.json');
  if (!manifest) {
    return GSAP_RANGE;
  }
  const { dependencies = {}, devDependencies = {} } = JSON.parse(manifest.toString('utf-8'));
  return dependencies['gsap'] ?? devDependencies['gsap'] ?? GSAP_RANGE;
}

/**
 * Adds `gsap` as a real dependency. It is a peer dependency of ng-gsap and is
 * deliberately never bundled, so a fresh install needs it explicitly.
 */
function installGsap(options: NgAddOptions): Rule {
  return (tree: Tree) =>
    addDependency('gsap', readVersion(tree), {
      type: DependencyType.Default,
      existing: ExistingBehavior.Skip,
      install: options.skipInstall ? InstallBehavior.None : InstallBehavior.Auto,
    });
}

/**
 * Inserts `provideGsap(...)` into the application config, adding the import for
 * it — and for ScrollTrigger, when requested — via the CLI's own AST helpers
 * rather than string surgery.
 */
function wireProvider(options: NgAddOptions): Rule {
  return addRootProvider(options.project ?? '', ({ code, external }) => {
    const settings: string[] = [];

    if (options.plugins) {
      settings.push(`plugins: [${external('ScrollTrigger', 'gsap/ScrollTrigger')}]`);
    }
    settings.push(`defaults: { ease: 'power2.out', duration: 0.6 }`);
    if (options.respectReducedMotion !== false) {
      settings.push('respectReducedMotion: true');
    }

    return code`${external('provideGsap', 'ng-gsap')}({ ${settings.join(', ')} })`;
  });
}

function report(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('ng-gsap is wired up. Animate something:');
    context.logger.info('');
    context.logger.info("  import { injectGSAP } from 'ng-gsap';");
    context.logger.info('');
    context.logger.info('  injectGSAP(() => {');
    context.logger.info("    gsap.to('.box', { x: this.open() ? 220 : 0 });");
    context.logger.info('  }, { scope: this.container });');
    context.logger.info('');
    context.logger.info('Reading a signal inside the callback is what makes it a dependency.');
    context.logger.info('');
  };
}

export function ngAdd(options: NgAddOptions): Rule {
  return chain([installGsap(options), wireProvider(options), report()]);
}
