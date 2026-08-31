# ng-gsap

A signals-first wrapper for using [GSAP](https://gsap.com) in Angular, in the spirit of [`@gsap/react`](https://gsap.com/resources/React).

`@gsap/react`'s `useGSAP` hook takes a manual dependency array. Angular doesn't need one — the core
primitive, `injectGSAP()`, wraps your animation callback in an Angular render effect, so any signal read
inside it becomes a live dependency automatically. See [`projects/ng-gsap/README.md`](projects/ng-gsap/README.md)
for the full pitch and API reference (that's also what ships on npm).

This repo is an Angular CLI workspace with two projects:

- **`projects/ng-gsap`** — the publishable library, with `ng-gsap/scroll-trigger` and `ng-gsap/testing` as
  separate entry points.
- **`projects/playground`** — a zoneless demo app with a live example for every primitive and directive
  (basic tween, hover directive, DI-composed timeline, ScrollTrigger progress, two-way scrubber, SVG draw-in,
  signal-driven list enter/leave).

## Requirements

- Node.js (LTS)
- [Yarn](https://yarnpkg.com) via [Corepack](https://nodejs.org/api/corepack.html) — run `corepack enable`
  once, then `yarn` resolves to the version pinned in `package.json`'s `packageManager` field. Do not use npm
  or pnpm in this repo; the `nodeLinker: node-modules` setting in `.yarnrc.yml` is there because Angular's
  tooling doesn't support Yarn's Plug'n'Play linker.

## Development

```bash
yarn install
yarn build:lib        # build the library into dist/ng-gsap — the playground imports from there
yarn start             # serve the playground at http://localhost:4200
yarn test              # run the library's unit tests (Vitest)
```

The playground's `tsconfig.json` path-maps `ng-gsap` (and its sub-entry points) to `dist/ng-gsap`, so
`yarn build:lib` must be re-run after library changes for the playground to pick them up. `yarn watch` runs
that build in watch mode if you're iterating on both at once.

## CI/CD

- **`.github/workflows/ci.yml`** — builds the library and playground and runs the test suite on every push/PR
  to `main`.
- **`.github/workflows/release.yml`** — publishes `ng-gsap` to npm on `v*.*.*` tags. Needs an `NPM_TOKEN`
  repository secret.
- **`.github/workflows/pages.yml`** — deploys the playground to GitHub Pages on push to `main`.

See [`HANDOFF.txt`](HANDOFF.txt) for what's finished, what's still open, and where this could go next.

## License

MIT — see [LICENSE](LICENSE).
