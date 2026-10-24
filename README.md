# ng-gsap

[![npm](https://img.shields.io/npm/v/ng-gsap?color=%23e40035&label=npm)](https://www.npmjs.com/package/ng-gsap)
[![CI](https://github.com/grynyk/ng-gsap/actions/workflows/ci.yml/badge.svg)](https://github.com/grynyk/ng-gsap/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/ng-gsap?color=%237c4dff)](LICENSE)

**Signals-first [GSAP](https://gsap.com) for Angular.** No dependency array, no teardown, SSR-safe by
construction.

- **Docs and live examples:** https://grynyk.github.io/ng-gsap/
- **npm:** https://www.npmjs.com/package/ng-gsap

```ts
injectGSAP(() => {
  // `open` is read here, so this re-runs whenever it changes
  gsap.to('.box', { x: this.open() ? 220 : 0 });
}, { scope: this.container });
```

The callback runs inside a `gsap.context()` driven by an Angular render effect. You never list what
the animation depends on — Angular tracks the signals you read — and the context reverts itself
before every re-run and again on destroy.

See [`projects/ng-gsap/README.md`](projects/ng-gsap/README.md) for the full API — that's what ships on
npm.

## Workspace layout

```
projects/ng-gsap/          the publishable library
  src/                     ng-gsap            — injectGSAP, provideGsap, animationSignals, gsapScrub
  router/                  ng-gsap/router     — provideGsapRouteTransitions
  scroll-trigger/          ng-gsap/scroll-trigger — injectScrollTrigger
  testing/                 ng-gsap/testing    — provideGsapTesting, advanceGsap
  schematics/              ng add ng-gsap
  spec-helpers/            shared test utilities (not published)
projects/playground/       docs site + live examples, prerendered
  src/app/core/            navigation model shared by shell, home and tests
  src/app/docs/            getting started, API reference, guides
  src/app/examples/        one page per idea
  src/app/shared/          page layouts and the code viewer
e2e/                       browser smoke test + SSR output checks
scripts/                   schematics build, package verification
```

## Requirements

- Node.js (LTS)
- [Yarn](https://yarnpkg.com) via [Corepack](https://nodejs.org/api/corepack.html) — run
  `corepack enable` once, then `yarn` resolves to the version pinned in `package.json`'s
  `packageManager` field. Don't use npm or pnpm here: the `nodeLinker: node-modules` setting in
  `.yarnrc.yml` exists because Angular's tooling doesn't support Yarn's Plug'n'Play linker.

## Development

```bash
yarn install
yarn build:lib          # library + schematics into dist/ng-gsap
yarn start              # serve the docs site at http://localhost:4200
yarn lint               # ESLint (TypeScript + Angular templates + a11y)
yarn test               # library unit tests (Vitest + jsdom)
yarn test:coverage      # the same, with thresholds enforced
yarn test:browser       # the same specs in headless Chromium
yarn test:playground    # docs site unit tests
yarn verify:ssr         # assert the prerendered output is correct
yarn e2e                # drive the built site in a real browser
yarn verify:package     # pack, install into a fresh app, run `ng add`, build
```

The playground path-maps `ng-gsap` to `dist/ng-gsap`, so `yarn build:lib` has to be re-run after
library changes. `yarn watch` does that in watch mode.

### Why so many verification commands

Each one covers something the others structurally cannot:

| Command | Covers what nothing else can |
| --- | --- |
| `yarn test` | Fast feedback on logic, in jsdom. Thresholds via `yarn test:coverage`. |
| `yarn test:browser` | Real layout and `matchMedia` — the only place ScrollTrigger genuinely runs. |
| `yarn verify:ssr` | The app rendered in Node with no DOM, asserting no animation side effects leak into server output. |
| `yarn e2e` | The production build, served the way GitHub Pages serves it, animations actually moving pixels. |
| `yarn verify:package` | The published tarball, installed by an unrelated app — exports map, peer ranges, `ng add`. |

## CI/CD

- **`ci.yml`** — lint, format, library and docs-site unit tests, both builds, plus a second job for
  the Chromium test run, SSR checks and end-to-end.
- **`release.yml`** — on a `v*` tag: verifies the tag matches the package version, runs everything,
  then publishes to npm through [trusted publishing](https://docs.npmjs.com/trusted-publishers)
  (OIDC), with provenance. An `NPM_TOKEN` secret is only needed for the very first publish; see
  [Releasing](CONTRIBUTING.md#releasing). A version that is already on npm is skipped rather than
  failed.
- **`pages.yml`** — deploys the prerendered docs site to GitHub Pages on push to `main`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow, the reasoning behind the API's
shape, and the non-obvious things that will bite you. [`CHANGELOG.md`](CHANGELOG.md) tracks releases.

## License

MIT — see [LICENSE](LICENSE).
