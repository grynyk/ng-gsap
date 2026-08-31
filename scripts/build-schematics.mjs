/**
 * Compiles the ng-add schematic into the built package.
 *
 * ng-packagr only builds the Angular entry points; schematics are plain
 * CommonJS run by the Angular CLI, so they get their own tsc pass and their
 * JSON manifests copied alongside.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'projects/ng-gsap/schematics');
const target = join(root, 'dist/ng-gsap/schematics');

execFileSync('npx', ['tsc', '-p', join(source, 'tsconfig.json')], {
  stdio: 'inherit',
  cwd: root,
});

await mkdir(target, { recursive: true });
await cp(join(source, 'collection.json'), join(target, 'collection.json'));
await mkdir(join(target, 'ng-add'), { recursive: true });
await cp(join(source, 'ng-add/schema.json'), join(target, 'ng-add/schema.json'));

// The published package is "type": "module", but schematics are CommonJS and
// the CLI `require()`s them. A nested manifest scopes that back to CJS for this
// folder only, without affecting the library's own ESM output.
await writeFile(join(target, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);

console.log('Built schematics -> dist/ng-gsap/schematics');
