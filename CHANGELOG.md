# Changelog

All notable changes to `ng-gsap` are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Until 1.0.0 the public API may still change: a breaking change to a documented export can land in any
0.x release and is always called out here. That covers every entry point — `ng-gsap`,
`ng-gsap/router`, `ng-gsap/scroll-trigger` and `ng-gsap/testing` — and the exported tokens and types.

## [0.0.5] — 2026-10-24

First public release.

### Added

- **`injectGSAP`** — the core primitive. Runs a callback inside a `gsap.context()` driven by an
  Angular render effect. You never list what an animation depends on: Angular tracks the signals you
  read, and the context reverts itself before every re-run and again on destroy. A `scope` signal that
  has not resolved yet makes the callback wait for the element rather than run unscoped against the
  whole document.
- **`provideGsap`** — app-wide plugin registration, `gsap.defaults()`, and opt-in
  `respectReducedMotion`, which collapses animation to its end state while the OS asks for reduced
  motion, follows the setting changing mid-session, and restores normal playback on teardown. The
  configuration is readable through the `GSAP_CONFIG` token.
- **`animationSignals`** — a tween or timeline's `progress` / `isActive` / `duration` as readonly
  signals, with `killOnDestroy` for animations whose lifetime belongs elsewhere.
- **`gsapScrub`** — a writable signal bound both ways to a timeline's progress.
- **`ng-gsap/scroll-trigger`** — `injectScrollTrigger`, exposing scroll position as signals and
  accepting the full `ScrollTrigger.StaticVars` surface. A `trigger` signal is waited for and the
  trigger re-created when it changes; an `animation` passed in is detached, never killed, so its owner
  keeps control of it. Where ScrollTrigger cannot run — server-side rendering, or jsdom, neither of
  which has layout to measure — the handle stays inert (`isSupported === false`) instead of throwing,
  so components using it remain unit-testable.
- **`ng-gsap/router`** — `provideGsapRouteTransitions`, animating routed views in and out app-wide
  without touching a component. Nested routes animate at the outlet depth that actually changed, and
  a navigation that swaps no view animates nothing. Leave snapshots are removed when the animation
  completes, reverse-completes or is killed, or at once when it is already finished. Errors thrown by
  a transition callback are reported through Angular's `ErrorHandler` and never disable later
  transitions. The configuration is readable through the `GSAP_ROUTE_TRANSITIONS` token.
  `@angular/router` is an optional peer dependency.
- **`ng-gsap/testing`** — `provideGsapTesting` and `advanceGsap`, which freeze GSAP and advance it by
  an exact number of milliseconds. Fake timers cannot drive GSAP, so this seeks the global timeline
  instead of faking the clock.
- **`ng add ng-gsap`** — installs `gsap` and wires `provideGsap()` into the application config using
  the Angular CLI's own AST helpers.

### Notes

- Requires Angular **22+** and `gsap` **3.12 or any later 3.x**, both peer dependencies. `gsap` is
  never bundled.
- `ng-gsap/router` clears the identity transform a finished enter animation leaves behind. Any
  transform other than `none` makes an element the containing block for `position: fixed`
  descendants, which would otherwise silently break ScrollTrigger pins inside a routed view. It writes
  to the style declaration directly rather than through `gsap.set()`, so it also works while
  `ng-gsap/testing` has the global timeline paused.
- Where the library chains onto callbacks you set on your own animations (`onUpdate`, `onComplete`,
  …), your callback still receives its `callbackScope` and params unchanged.
- Verified in five independent ways before release: unit tests in jsdom and in real headless
  Chromium, prerendered server output, the production build driven in a browser, and the published
  tarball installed into a freshly generated Angular application.

[0.0.5]: https://github.com/grynyk/ng-gsap/releases/tag/v0.0.5
