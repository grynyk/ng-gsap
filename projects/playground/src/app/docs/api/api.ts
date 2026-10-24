import { Component } from '@angular/core';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { DocPage } from '../../shared/doc-page/doc-page';

const INJECT_GSAP = `const { context, contextSafe } = injectGSAP(
  (ctx) => {
    gsap.to('.box', { x: this.open() ? 220 : 0 });
  },
  { scope: this.stage },   // optional; also takes { injector }
);`;

const CONTEXT_SAFE = `// creates a tween → wrap it, so it joins the same context
protected spin = this.anim.contextSafe((event: MouseEvent) => {
  gsap.to(event.target, { rotate: '+=180' });
});

// only writes a signal → no wrapper needed, the callback re-runs and cleans up
protected toggle() {
  this.open.update((v) => !v);
}`;

const PROVIDE_GSAP = `provideGsap({
  plugins: [ScrollTrigger],                        // registered once, app-wide
  defaults: { ease: 'power2.out', duration: 0.6 }, // gsap.defaults()
  respectReducedMotion: true,                      // honour the OS setting
});`;

const ANIMATION_SIGNALS = `private timeline = gsap.timeline().to('.box', { x: 200 });
protected playback = animationSignals(this.timeline);

// <progress [value]="playback.progress()"></progress>
// playback.isActive() / playback.duration() are signals too`;

const GSAP_SCRUB = `private timeline = gsap.timeline({ paused: true });
protected progress = gsapScrub(this.timeline);

// <input type="range" min="0" max="1" step="0.001" [(ngModel)]="progress" />`;

const SCROLL_TRIGGER = `import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';

protected scroll = injectScrollTrigger({
  trigger: this.section,     // element, ElementRef, or a signal of one
  start: 'top center',
  end: 'bottom center',
  pin: true,                 // the full ScrollTrigger.StaticVars surface
});

// scroll.progress() · scroll.isActive() · scroll.direction()
// scroll.instance() · scroll.isSupported`;

const ROUTER = `import { provideGsapRouteTransitions } from 'ng-gsap/router';

provideGsapRouteTransitions({
  // the context is { element, depth, from, to }:
  // depth 0 is the top-level outlet, 1 a view inside it, and so on;
  // from and to are the URLs being left and entered
  enter: ({ element, depth }) =>
    gsap.from(element, { autoAlpha: 0, y: depth === 0 ? 24 : 12, duration: 0.4 }),
  leave: ({ element }) => gsap.to(element, { autoAlpha: 0, duration: 0.3 }),
  skipInitialTransition: true,     // default: the first view the app renders isn't animated
  outletSelector: 'router-outlet', // default: narrow it only for sibling outlets at one level
});`;

const TESTING = `import { advanceGsap, provideGsapTesting } from 'ng-gsap/testing';

TestBed.configureTestingModule({ providers: [provideGsapTesting()] });

const tween = gsap.to(box, { x: 100, duration: 1 });
advanceGsap(500);
expect(tween.progress()).toBe(0.5); // exactly 0.5, every run`;

@Component({
  selector: 'app-api',
  imports: [DocPage, CodePreview],
  templateUrl: './api.html',
})
export class Api {
  protected readonly injectGsap = INJECT_GSAP;
  protected readonly contextSafe = CONTEXT_SAFE;
  protected readonly provideGsap = PROVIDE_GSAP;
  protected readonly animationSignals = ANIMATION_SIGNALS;
  protected readonly gsapScrub = GSAP_SCRUB;
  protected readonly scrollTrigger = SCROLL_TRIGGER;
  protected readonly router = ROUTER;
  protected readonly testing = TESTING;
}
