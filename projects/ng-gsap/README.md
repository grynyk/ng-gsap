# ng-gsap

[![npm](https://img.shields.io/npm/v/ng-gsap?color=brightgreen&label=npm)](https://www.npmjs.com/package/ng-gsap)
[![CI](https://github.com/grynyk/ng-gsap/actions/workflows/ci.yml/badge.svg)](https://github.com/grynyk/ng-gsap/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-7c4dff)](https://github.com/grynyk/ng-gsap/blob/main/LICENSE)

**Signals-first [GSAP](https://gsap.com) for Angular.** No dependency array, no teardown, SSR-safe by
construction.

**[Documentation and live examples →](https://grynyk.github.io/ng-gsap/)**

Requires Angular **22+** and `gsap` **3.12+**, both peer dependencies. Bring your own `gsap` install;
this package never bundles it.

Pre-1.0 and versioned with [SemVer](https://semver.org): until 1.0.0 a breaking change to a documented
export can land in any 0.x release, and the changelog always calls it out.

## The idea

Wiring an animation library into a component usually means keeping two things in sync by hand: a list
of everything the animation depends on, and the cleanup for everything it created. `injectGSAP()`
removes both.

```ts
injectGSAP(() => {
  // `open` is read here, so this re-runs whenever it changes
  gsap.to('.box', { x: this.open() ? 220 : 0 });
}, { scope: this.container });
```

The callback runs inside a `gsap.context()` driven by an Angular render effect. You never list what
the animation depends on: Angular tracks the signals you read, so changing one re-runs the callback.
The context reverts itself before every re-run and again on destroy, so there is no teardown either.

## Install

```bash
ng add ng-gsap
```

The schematic adds `gsap` and wires `provideGsap()` into your application config. Or do it by hand:

```bash
npm install ng-gsap gsap
```

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from 'ng-gsap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGsap({
      plugins: [ScrollTrigger], // only the ones you use; the rest stay tree-shaken out
      defaults: { ease: 'power2.out', duration: 0.6 },
      respectReducedMotion: true,
    }),
  ],
};
```

## Quick start

```ts
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';

@Component({
  selector: 'app-box',
  template: `
    <div #container><div class="box"></div></div>
    <button (click)="toggle()">Toggle</button>
  `,
})
export class Box {
  private container = viewChild.required<ElementRef>('container');
  protected open = signal(false);

  constructor() {
    injectGSAP(
      () => {
        gsap.to('.box', { x: this.open() ? 220 : 0 });
      },
      { scope: this.container },
    );
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }
}
```

`scope` confines every selector string inside the callback to that element, so `'.box'` can't reach
into another component. A `scope` signal that hasn't resolved yet (an optional `viewChild()` inside an
`@if`) makes the callback wait: it runs as soon as the element exists, rather than running unscoped
against the whole document.

## API

| Export | What it does |
| --- | --- |
| `injectGSAP(callback, { scope, injector })` | The core primitive. Auto-tracked signal dependencies, scoped `gsap.context()`, auto-revert on re-run and destroy, no-ops during SSR. Returns `{ context, contextSafe }`. |
| `provideGsap({ plugins, defaults, respectReducedMotion })` | App-wide plugin registration, `gsap.defaults()`, and optional reduced-motion handling — once, at bootstrap. |
| `animationSignals(animation, { killOnDestroy, injector })` | Mirrors a Tween or Timeline's `progress` / `isActive` / `duration` as readonly signals. |
| `gsapScrub(timeline, { killOnDestroy, injector })` | A `WritableSignal<number>` bound both ways to a timeline's progress — drag a slider to seek, or play the timeline and watch the signal follow. |

Four exports here, and four more across three optional entry points: `injectScrollTrigger`
(`ng-gsap/scroll-trigger`), `provideGsapRouteTransitions` (`ng-gsap/router`), and `provideGsapTesting`
with `advanceGsap` (`ng-gsap/testing`). There are deliberately no `[gsapTo]`-style directives: they'd
be a thin wrapper over a one-line `gsap.to()` that you'd fight the moment you wanted a timeline, an
ease, or a callback. Write GSAP; let this library handle the Angular half.

### Shared options

- `injector` — every `inject*` function and signal helper resolves what it needs from the injection
  context you call it in. Pass an `Injector` only when calling from outside one.
- `killOnDestroy` (`animationSignals`, `gsapScrub`) — kill the animation when the injection context is
  destroyed. On by default; turn it off when you are mirroring an animation whose lifetime belongs to
  something else.

### Tokens and types

`GSAP_CONFIG` holds the `GsapConfig` given to `provideGsap`, and `GSAP_ROUTE_TRANSITIONS` the
`GsapRouteTransitionsConfig` given to `provideGsapRouteTransitions`; inject either to read the active
configuration. Every option and handle type is exported too: `GsapConfig`, `InjectGsapOptions`,
`GsapHandle`, `GsapScope`, `GsapScopeElement`, `AnimationSignalsOptions`, `AnimationSignals`,
`GsapScrubOptions`, `ScrollTriggerTarget`, `InjectScrollTriggerOptions`, `ScrollTriggerHandle`,
`RouteTransitionContext`, `RouteTransition` and `GsapRouteTransitionsConfig`. All of them are covered
by the SemVer promise above.

### `contextSafe`

The reactive callback already runs inside the context. A handler defined outside it does not, so
tweens it creates would escape cleanup:

```ts
private anim = injectGSAP(() => { ... }, { scope: this.stage });

// creates a tween → wrap it
protected spin = this.anim.contextSafe((event: MouseEvent) => {
  gsap.to(event.target, { rotate: '+=180' });
});

// only writes a signal → no wrapper needed, the callback re-runs and cleans up
protected toggle(): void {
  this.open.update((v) => !v);
}
```

Wrapping a plain signal write is a common cargo cult. It does nothing.

### Re-runs revert first

Each re-run starts from a clean slate rather than layering new tweens over old ones. With
dependencies tracked automatically, re-runs are frequent enough that accumulating would be a footgun.

## Reduced motion

```ts
provideGsap({ respectReducedMotion: true });
```

While the OS reports `prefers-reduced-motion: reduce`, animation collapses to its end state — elements
land where they belong instead of being stranded mid-`from()`, callbacks still fire, and ScrollTrigger
still scrubs. It reacts to the setting changing mid-session and restores normal playback on teardown.

## `ng-gsap/scroll-trigger`

A separate entry point, so ScrollTrigger's weight and plugin registration stay opt-in.

```ts
import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';

private section = viewChild.required<ElementRef>('section');

protected scroll = injectScrollTrigger({
  trigger: this.section,
  start: 'top center',
  end: 'bottom center',
});
// <div [style.opacity]="scroll.progress()">
```

`progress`, `isActive` and `direction` are signals; `instance` is the live ScrollTrigger for
imperative work like `refresh()`. Pass a signal as `trigger` and the trigger waits for the element,
then re-creates itself whenever it changes. It's killed on destroy. An `animation` you pass in stays
yours: a re-created or destroyed trigger stops driving it but never kills it, so create it inside
`injectGSAP` and let the context revert it.

Where ScrollTrigger genuinely can't run — server-side rendering, or jsdom, neither of which has layout
to measure — the handle stays inert (`isSupported === false`) instead of throwing, so components using
it are still unit-testable.

## `ng-gsap/router`

Animates routed views in and out app-wide, without touching a single component. `@angular/router` is
an optional peer dependency.

```ts
import { provideGsapRouteTransitions } from 'ng-gsap/router';

providers: [
  provideRouter(routes),
  provideGsap(),
  provideGsapRouteTransitions({
    enter: ({ element }) => gsap.from(element, { autoAlpha: 0, y: 24, duration: 0.4 }),
    leave: ({ element }) => gsap.to(element, { autoAlpha: 0, duration: 0.3 }),
  }),
];
```

Angular's router doesn't wait for animations before destroying a view, so rather than blocking
navigation, `leave` receives a pinned clone of the outgoing element and animates that. The clone keeps
its classes and inline styles; what it can't carry over is live state — canvas contents, video
position, uncommitted form input. Use `enter` alone for views where that matters.

Nested routes are handled: each navigation animates the view at the outlet depth that actually
changed, so moving between two children of a section animates the child rather than re-animating the
whole shell. The transition receives that `depth` (`0` is the top-level outlet), so you can treat a
shell change differently from a change within a section.

The transition receives `{ element, depth, from, to }`: the host element (for `leave`, the snapshot),
the outlet depth, and the URLs being left and entered. Two options tune the behaviour:
`skipInitialTransition` (default `true`) leaves the first view the app renders alone, and
`outletSelector` (default `'router-outlet'`) narrows which outlets are walked, which you only need with
sibling outlets at one level.

A navigation that swaps no view animates nothing — a rejected guard, or a change that only alters
route params, where Angular reuses the component. One thing to keep in mind: a `leave` snapshot is
briefly a second copy of the outgoing page in the DOM, which can make end-to-end selectors
ambiguous.

The snapshot is removed when the leave animation completes, reverse-completes or is killed; an
animation that is already finished when you return it removes it at once. Callbacks you set on your
own animation (`onComplete` and friends) keep running, with their params and `callbackScope` intact.

## `ng-gsap/testing`

```ts
import { advanceGsap, provideGsapTesting } from 'ng-gsap/testing';

TestBed.configureTestingModule({ providers: [provideGsapTesting()] });

const tween = gsap.to(box, { x: 100, duration: 1 });
advanceGsap(500);
expect(tween.progress()).toBe(0.5); // exactly 0.5, every run
```

`provideGsapTesting()` pauses GSAP's global timeline so nothing moves on its own, and restores
playback when the TestBed environment is torn down. `advanceGsap(ms)` seeks it forward by exactly the
time you ask for.

Because the global timeline is paused, **`gsap.set()` does not apply inside a frozen test** — it is a
zero-duration tween, and a paused timeline never renders it. Set properties directly, or drive them
through an animation you advance.

Note that **fake timers cannot drive GSAP**, in this or any wrapper: GSAP captures a direct reference
to `Date.now` when its module first loads, so it keeps reading real wall-clock time no matter what
`vi.useFakeTimers()` does to the global `Date`. Seeking sidesteps the clock entirely, which is why
this is exact rather than approximately right.

## Server-side rendering

`injectGSAP` runs in the `write` phase of Angular's render lifecycle, which never runs on the server.
No `isPlatformBrowser` checks, no `afterNextRender` wrappers — calling it from a component that gets
prerendered is safe by construction. `injectScrollTrigger` and `provideGsapRouteTransitions` detect
the absence of a browser and stay inert.

## License

MIT
