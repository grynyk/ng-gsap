import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { DocPage } from '../../shared/doc-page/doc-page';

const SSR = `// Nothing to configure. injectGSAP runs in the render lifecycle's
// write phase, which never executes on the server.
injectGSAP(() => {
  gsap.to('.box', { x: 220 });
}, { scope: this.stage });`;

const TESTING = `import { advanceGsap, provideGsapTesting } from 'ng-gsap/testing';

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
});

it('slides the box open', async () => {
  // Box animates '.box' with { x: 220, duration: 1, ease: 'none' } while open
  const fixture = TestBed.createComponent(Box);
  fixture.componentInstance.open.set(true);
  fixture.detectChanges();
  await fixture.whenStable(); // the render effect has run, the tween exists

  advanceGsap(500);

  expect(gsap.getProperty('.box', 'x')).toBe(110); // halfway, exactly, every run
});`;

const ROUTER = `import { provideGsapRouteTransitions } from 'ng-gsap/router';

providers: [
  provideRouter(routes),
  provideGsap(),
  provideGsapRouteTransitions({
    enter: ({ element }) => gsap.from(element, { autoAlpha: 0, y: 24, duration: 0.4 }),
    leave: ({ element }) => gsap.to(element, { autoAlpha: 0, duration: 0.3 }),
  }),
]`;

const REDUCED_MOTION = `provideGsap({ respectReducedMotion: true });`;

const SMOOTH_SCROLL = `import { afterRenderEffect } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export class App {
  constructor() {
    // Render effects never run on the server, so Lenis is never constructed there.
    afterRenderEffect((onCleanup) => {
      const lenis = new Lenis();
      const stopSync = lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000); // ticker time is in seconds
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      onCleanup(() => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33); // GSAP's defaults
        stopSync();
        lenis.destroy();
      });
    });
  }
}`;

@Component({
  selector: 'app-guides',
  imports: [DocPage, CodePreview, RouterLink],
  templateUrl: './guides.html',
})
export class Guides {
  protected readonly ssr = SSR;
  protected readonly testing = TESTING;
  protected readonly router = ROUTER;
  protected readonly reducedMotion = REDUCED_MOTION;
  protected readonly smoothScroll = SMOOTH_SCROLL;
}
