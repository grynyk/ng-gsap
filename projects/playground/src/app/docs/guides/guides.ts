import { Component } from '@angular/core';
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

@Component({
  selector: 'app-guides',
  imports: [DocPage, CodePreview],
  templateUrl: './guides.html',
})
export class Guides {
  protected readonly ssr = SSR;
  protected readonly testing = TESTING;
  protected readonly router = ROUTER;
  protected readonly reducedMotion = REDUCED_MOTION;
}
