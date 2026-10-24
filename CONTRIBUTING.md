# Contributing to ng-gsap

Thanks for taking a look. This is a deliberately small library — please read
[Scope](#scope) before proposing a new export.

## Getting set up

Requires Node.js LTS and Yarn via Corepack (`corepack enable`). Don't use npm or pnpm here: the
`nodeLinker: node-modules` setting in `.yarnrc.yml` exists because Angular's tooling doesn't support
Yarn's Plug'n'Play linker.

```bash
yarn install
yarn build:lib     # library + schematics into dist/ng-gsap
yarn start         # docs site at http://localhost:4200
```

The docs site path-maps `ng-gsap` to `dist/ng-gsap`, so **re-run `yarn build:lib` after library
changes** or the site won't see them. `yarn watch` does that in watch mode.

## Repository layout

```
projects/ng-gsap/          the publishable library
  src/                     ng-gsap                 — injectGSAP, provideGsap, animationSignals, gsapScrub
  router/                  ng-gsap/router          — provideGsapRouteTransitions
  scroll-trigger/          ng-gsap/scroll-trigger  — injectScrollTrigger
  testing/                 ng-gsap/testing         — provideGsapTesting, advanceGsap
  schematics/              ng add ng-gsap
  spec-helpers/            shared test utilities (not published)
projects/playground/       docs site + live examples, prerendered
e2e/                       browser smoke test + SSR output checks
scripts/                   schematics build, package verification
```

## Verification

Every command covers something the others structurally cannot. Run the relevant ones before opening a
PR; CI runs all but the last on every push.

| Command | Covers what nothing else can |
| --- | --- |
| `yarn lint` | TypeScript, Angular templates, accessibility, unused code |
| `yarn test` | Logic, in jsdom. Fast |
| `yarn test:coverage` | The same, with thresholds enforced |
| `yarn test:browser` | Real layout and `matchMedia` — the only place ScrollTrigger genuinely runs |
| `yarn verify:ssr` | The app rendered in Node with no DOM |
| `yarn e2e` | The production build, animations actually moving pixels |
| `yarn verify:package` | The published tarball, installed by an unrelated app |

Check the **exit code**, not just the summary line. A run can print "74 passed" and still exit
non-zero — Vitest fails the run on unhandled errors even when every test passed. That is exactly how
the first CI failure slipped past local verification.

Coverage thresholds are enforced in `angular.json` and currently sit just under the real numbers
(~99% statements, ~99% branches). If you legitimately can't cover a branch, say why in a comment
rather than lowering the threshold.

### Adding a secondary entry point

Create `projects/ng-gsap/<name>/` with `ng-package.json`, `package.json` and `src/public-api.ts`,
then add the path mapping to `tsconfig.json` and the spec glob to
`projects/ng-gsap/tsconfig.spec.json`. **Check `ng test ng-gsap --list-tests` actually lists your new
specs** — test discovery is rooted at the project's `sourceRoot`, and specs outside it are silently
skipped. That exact mistake once left two entry points untested while CI stayed green.

## Scope

The library's value is that `injectGSAP` is the one thing you have to learn. Every export past that
dilutes it.

An attribute-directive layer (`gsapTo`, `gsapFrom`, `gsapHover`, `gsapTimeline`, …) was deliberately
removed. It was thin sugar over one-line `gsap.to()` calls that you outgrew the moment you wanted a
timeline or a callback, and every one of them tore down with
`gsap.getTweensOf(el).forEach(t => t.kill())` — which kills *every* tween on that element, so two
directives on one host fought each other. **Please don't propose bringing it back**; the answer is to
write the GSAP call inside `injectGSAP`.

New entry points are welcome when they carry real weight (`ng-gsap/router` earns it). Declarative
wrappers over single GSAP calls are not.

## Things that will bite you

These were all measured, not reasoned about. Please don't "simplify" them back.

- **Fake timers cannot drive GSAP.** It does `var _getTime = Date.now` at module load, capturing the
  reference, so it keeps reading real wall-clock time whatever `vi.useFakeTimers()` does to the
  global `Date`. A 500ms advance moved a 1s tween to progress 0.001. `advanceGsap` seeks the global
  timeline instead.
- **`gsap.ticker.sleep()` doesn't freeze playback** either — creating any tween wakes it again
  (measured drift 0.053 over 50ms). `provideGsapTesting` pauses the global timeline, which holds.
- **`advanceGsap` accumulates whole milliseconds** and divides once, from a zero clock origin.
  Doing `time(time() + delta)` in seconds drifts (`0.49999999999999994`).
- **Never let an error escape into an RxJS `next` handler.** It surfaces as an unhandled error, which
  fails the test run even when every test passes. Report caller errors through Angular's
  `ErrorHandler` instead, as `ng-gsap/router` does.
- **`gsap.set()` does nothing while the global timeline is paused.** It is a zero-duration tween, so
  a paused root never renders it — which is the state `provideGsapTesting` puts gsap in. Library code
  that has to touch the DOM unconditionally (like the router's transform cleanup) must write to the
  style declaration directly.
- **`gsap.eventCallback` replaces, it does not chain.** Assigning one silently discards a callback
  the caller set. Use `chainEventCallback`, or chain by hand as `ng-gsap/router` does.
- **jsdom has no `matchMedia` at all**, so `registerPlugin(ScrollTrigger)` throws there.
  `injectScrollTrigger` detects this and returns an inert handle. Specs that stub `matchMedia` must
  save and restore the original property descriptor — they run in both jsdom and Chromium, and a
  leaked stub silently changes what other specs exercise.
- **Test isolation is on** (`"isolate": true`). The library manipulates global GSAP state — ticker,
  defaults, global timeline — so specs sharing a process was a real hazard.
- **`gsapScrub` breaks its feedback loop with an epsilon comparison, not a flag.** `effect()` flushes
  asynchronously, so a synchronously-reset flag is already `false` by the time the effect body runs.
- **The routed view is the outlet's next sibling.** `ng-gsap/router` depends on this; it was verified
  in a browser, not assumed. If a future Angular changes it, that's what breaks.

## Style

Prettier and ESLint are enforced in CI (`yarn format`, `yarn lint:fix`). Beyond that: comments should
explain *why*, not restate the code. Several comments in this repo record measurements that cost real
time to establish — keep that kind.

## Commits and PRs

Branch from `main`, keep the working tree green, and describe what you verified. If you changed
anything animation-timing related, say which of the verification commands you ran.

### Releasing

1. Set the version in `projects/ng-gsap/package.json` and add the `CHANGELOG.md` section.
2. Commit, tag that commit `vX.Y.Z`, push the tag. `release.yml` refuses to publish when the tag and
   the package version disagree, and runs every verification command before `npm publish`.
3. Authentication is npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): on
   npmjs.com the package trusts `grynyk/ng-gsap` + `release.yml` through GitHub's OIDC token, so there
   is no token to store or rotate. A pre-release version (`1.1.0-beta.1`) is published under the
   `next` dist-tag. A version that already exists on npm is skipped, so re-running a failed release is
   safe.

   Trusted publishing can only be configured for a package that already exists, and the registry
   does not let a token create one with a direct publish either. So the very first version goes
   through [staged publishing](https://docs.npmjs.com/staged-publishing): the same workflow,
   authenticated with an `NPM_TOKEN` repository secret (a granular access token, "Read and write
   (publish and stage)" on all packages, shortest expiry), runs `npm stage publish`, which creates
   the package and queues the version. A maintainer then approves it once, with 2FA, under Staged
   Packages on npmjs.com or with `npm stage approve <stage-id>` (npm 11.15+). After that, register
   the trusted publisher (`npm trust github ng-gsap --file release.yml --repo grynyk/ng-gsap
   --allow-publish`), delete the secret and revoke the token. npm removes a trusted-publisher
   configuration that has not published within 2 days of being created, so register it right before
   the next tag push.

The public API is not frozen until 1.0.0. Anything that changes the signature, return type or
observable behaviour of a documented export is still a breaking change — including the optional entry
points — and must be called out under its own heading in the changelog. Add a `CHANGELOG.md` entry with every user-visible change.
