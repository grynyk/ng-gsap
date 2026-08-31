# Changelog

All notable changes to `ng-gsap` are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

From 1.0.0 the public API is stable: no breaking change to any documented export lands outside a major
release. That covers every entry point — `ng-gsap`, `ng-gsap/router`, `ng-gsap/scroll-trigger` and
`ng-gsap/testing`.

## [1.0.0] — 2026-08-31

First stable release.

### Added

- **`injectGSAP`** — the core primitive. Runs a callback inside a `gsap.context()` driven by an
  Angular render effect. You never list what an animation depends on: Angular tracks the signals you
  read, and the context reverts itself before every re-run and again on destroy.
- **`provideGsap`** — app-wide plugin registration, `gsap.defaults()`, and opt-in
  `respectReducedMotion`, which collapses animation to its end state while the OS asks for reduced
  motion, follows the setting changing mid-session, and restores normal playback on teardown.
- **`animationSignals`** — a tween or timeline's `progress` / `isActive` / `duration` as readonly
  signals, with `killOnDestroy` for animations whose lifetime belongs elsewhere.
- **`gsapScrub`** — a writable signal bound both ways to a timeline's progress.
- **`ng-gsap/scroll-trigger`** — `injectScrollTrigger`, exposing scroll position as signals and
  accepting the full `ScrollTrigger.StaticVars` surface. Where ScrollTrigger cannot run — server-side
  rendering, or jsdom, neither of which has layout to measure — the handle stays inert
  (`isSupported === false`) instead of throwing, so components using it remain unit-testable.
- **`ng-gsap/router`** — `provideGsapRouteTransitions`, animating routed views in and out app-wide
  without touching a component. Nested routes animate at the outlet depth that actually changed, and
  a navigation that swaps no view animates nothing. `@angular/router` is an optional peer dependency.
- **`ng-gsap/testing`** — `provideGsapTesting` and `advanceGsap`, which freeze GSAP and advance it by
  an exact number of milliseconds. Fake timers cannot drive GSAP, so this seeks the global timeline
  instead of faking the clock.
- **`ng add ng-gsap`** — installs `gsap` and wires `provideGsap()` into the application config using
  the Angular CLI's own AST helpers.

### Notes

- Requires Angular **22+** and `gsap` **3.12+**, both peer dependencies. `gsap` is never bundled.
- `ng-gsap/router` clears the identity transform a finished enter animation leaves behind. Any
  transform other than `none` makes an element the containing block for `position: fixed`
  descendants, which would otherwise silently break ScrollTrigger pins inside a routed view.
- Verified in five independent ways before release: unit tests in jsdom and in real headless
  Chromium, prerendered server output, the production build driven in a browser, and the published
  tarball installed into a freshly generated Angular application.
