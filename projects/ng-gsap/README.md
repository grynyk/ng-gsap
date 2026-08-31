# ng-gsap

A signals-first wrapper for using [GSAP](https://gsap.com) in Angular, in the spirit of [`@gsap/react`](https://gsap.com/resources/React).

Requires Angular **21+** and `gsap` **3.12+** (both peer dependencies — bring your own `gsap` install, this package never bundles it).

## Why this isn't just a port

`@gsap/react`'s `useGSAP` hook takes a manual dependency array, same as `useEffect` — you have to remember to
list every reactive value your animation reads. Angular doesn't need that: an `effect()` already auto-tracks
every signal read inside it. So the core primitive, `injectGSAP()`, wraps your animation callback in an
effect — **read a signal inside the callback and it becomes a live dependency automatically, no array to
maintain.**

Everything else follows the same idea: signal in, signal out, no `NgZone` juggling (GSAP's rAF ticker runs
outside Angular; signals notify consumers directly, which is exactly what zoneless change detection wants).

## Install

```bash
npm install ng-gsap gsap
```

## Quick start

```ts
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';

@Component({ selector: 'app-box', template: `<div #container><div class="box" (click)="toggle()"></div></div>` })
export class Box {
  private container = viewChild.required<ElementRef>('container');
  private open = signal(false);

  private anim = injectGSAP(() => {
    gsap.to('.box', { x: this.open() ? 200 : 0 }); // reading open() here IS the dependency
  }, { scope: this.container });

  toggle = this.anim.contextSafe(() => this.open.update((v) => !v));
}
```

## API

| Export | What it does |
| --- | --- |
| `provideGsap(config)` | App-wide plugin registration + `gsap.defaults()`, once at bootstrap. |
| `injectGSAP(callback, { scope })` | The core primitive: auto-tracked signal deps, scoped `gsap.context()`, auto-revert on re-run and destroy, SSR-safe. Returns `{ context, contextSafe }`. |
| `animationSignals(animation)` | Mirrors a Tween/Timeline's `progress` / `isActive` / `duration` as readonly signals. |
| `gsapScrub(timeline)` | Returns a `WritableSignal<number>` two-way bound to a timeline's progress — drag a slider to seek, or play the timeline and watch the signal follow. |
| `[gsapTo]` / `[gsapFrom]` / `[gsapFromTo]` | Declarative attribute directives. Re-tween automatically when the bound vars change. Inside a `gsapTimeline` container they join the shared timeline instead of animating standalone. |
| `[gsapHover]` / `[gsapHoverLeave]` | Declarative hover in/out. Without `gsapHoverLeave`, the enter tween is simply reversed. |
| `gsapTimeline` | Provides a shared timeline via DI so descendant `gsapTo`/`gsapFrom`/`gsapFromTo` directives can compose a sequence declaratively, no timeline reference wired through the component. |

### `ng-gsap/scroll-trigger`

Separate entry point so ScrollTrigger's weight and plugin registration stay fully opt-in.

```ts
import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';

const { progress, isActive, direction } = injectScrollTrigger({ trigger: section, start: 'top center' });
```

### `ng-gsap/testing`

```ts
import { provideGsapTesting, tickGsap } from 'ng-gsap/testing';

vi.useFakeTimers();
TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
// ...
vi.advanceTimersByTime(500);
tickGsap(); // force gsap to process the elapsed time synchronously, deterministically
```

## License

MIT
