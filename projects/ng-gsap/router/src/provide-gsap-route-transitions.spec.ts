import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Routes } from '@angular/router';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import type { RouteTransitionContext } from './provide-gsap-route-transitions';
import { provideGsapRouteTransitions } from './provide-gsap-route-transitions';

@Component({ selector: 'gsap-page-one', template: '<p>one</p>' })
class PageOne {}

@Component({ selector: 'gsap-page-two', template: '<p>two</p>' })
class PageTwo {}

@Component({ selector: 'gsap-child-a', template: '<p>a</p>' })
class ChildA {}

@Component({ selector: 'gsap-child-b', template: '<p>b</p>' })
class ChildB {}

/** A section with its own nested outlet, one level below the shell. */
@Component({
  selector: 'gsap-section',
  imports: [RouterOutlet],
  template: '<h2>section</h2><router-outlet />',
})
class Section {}

@Component({ selector: 'gsap-shell', imports: [RouterOutlet], template: '<router-outlet />' })
class Shell {}

const routes: Routes = [
  { path: 'one', component: PageOne },
  { path: 'two', component: PageTwo },
  {
    path: 'section',
    component: Section,
    children: [
      { path: 'a', component: ChildA },
      { path: 'b', component: ChildB },
    ],
  },
];

async function setup(
  config: Parameters<typeof provideGsapRouteTransitions>[0],
  routeConfig: Routes = routes,
) {
  TestBed.configureTestingModule({
    providers: [provideRouter(routeConfig), provideGsapRouteTransitions(config)],
  });

  const router = TestBed.inject(Router);
  const fixture = TestBed.createComponent(Shell);
  fixture.detectChanges();

  const navigate = async (url: string) => {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  return { fixture, router, navigate };
}

describe('provideGsapRouteTransitions', () => {
  describe('enter', () => {
    it('runs on the newly activated view element', async () => {
      const seen: RouteTransitionContext[] = [];
      const { navigate } = await setup({
        skipInitialTransition: false,
        enter: (context) => void seen.push(context),
      });

      await navigate('/one');

      expect(seen.length).toBe(1);
      expect(seen[0].element.tagName.toLowerCase()).toBe('gsap-page-one');
      expect(seen[0].to).toBe('/one');
      expect(seen[0].depth).toBe(0);
    });

    it('skips the first view by default, then animates subsequent ones', async () => {
      const entered: string[] = [];
      const { navigate } = await setup({ enter: ({ to }) => void entered.push(to) });

      await navigate('/one');
      expect(entered).toEqual([]);

      await navigate('/two');
      expect(entered).toEqual(['/two']);
    });

    it('reports the URL it came from', async () => {
      const seen: RouteTransitionContext[] = [];
      const { navigate } = await setup({ enter: (context) => void seen.push(context) });

      await navigate('/one');
      await navigate('/two');

      expect(seen[0].from).toBe('/one');
      expect(seen[0].to).toBe('/two');
    });
  });

  describe('transform cleanup', () => {
    it('clears the identity transform a finished enter animation leaves behind', async () => {
      const { fixture, navigate } = await setup({
        enter: ({ element }) => gsap.from(element, { y: 24, duration: 0.2 }),
      });

      await navigate('/one');
      await navigate('/two');
      await new Promise((resolve) => setTimeout(resolve, 400));
      fixture.detectChanges();

      const view = fixture.nativeElement.querySelector('gsap-page-two') as HTMLElement;
      // A leftover `transform: translate(0px, 0px)` is visually invisible but
      // makes this element a containing block for position: fixed descendants,
      // which breaks ScrollTrigger pins inside the routed view.
      expect(view.style.transform).toBe('');
    });

    it('leaves a transform the caller meant to keep', async () => {
      const { fixture, navigate } = await setup({
        enter: ({ element }) => gsap.to(element, { x: 40, duration: 0.2 }),
      });

      await navigate('/one');
      await navigate('/two');
      await new Promise((resolve) => setTimeout(resolve, 400));
      fixture.detectChanges();

      const view = fixture.nativeElement.querySelector('gsap-page-two') as HTMLElement;
      expect(view.style.transform).toContain('40');
    });
  });

  describe('nested routes', () => {
    it('animates the child view, not the shell, when only the child changes', async () => {
      const seen: RouteTransitionContext[] = [];
      const { navigate } = await setup({ enter: (context) => void seen.push(context) });

      await navigate('/section/a');
      await navigate('/section/b');

      expect(seen.length).toBe(1);
      expect(seen[0].depth).toBe(1);
      expect(seen[0].element.tagName.toLowerCase()).toBe('gsap-child-b');
    });

    it('animates the outer view when the section itself changes', async () => {
      const seen: RouteTransitionContext[] = [];
      const { navigate } = await setup({ enter: (context) => void seen.push(context) });

      await navigate('/section/a');
      await navigate('/one');

      expect(seen.length).toBe(1);
      expect(seen[0].depth).toBe(0);
      expect(seen[0].element.tagName.toLowerCase()).toBe('gsap-page-one');
    });

    it('snapshots the child view when leaving a nested route', async () => {
      const seen: RouteTransitionContext[] = [];
      const { navigate } = await setup({ leave: (context) => void seen.push(context) });

      await navigate('/section/a');
      await navigate('/section/b');

      expect(seen.length).toBe(1);
      expect(seen[0].depth).toBe(1);
      expect(seen[0].element.tagName.toLowerCase()).toBe('gsap-child-a');
    });
  });

  describe('leave', () => {
    it('animates a detached snapshot and removes it when done', async () => {
      let clone: HTMLElement | undefined;
      const { navigate } = await setup({
        leave: ({ element }) => {
          clone = element;
          expect(element.isConnected).toBe(true);
          expect(element.style.position).toBe('fixed');
          return gsap.to(element, { opacity: 0, duration: 0.2 });
        },
      });

      await navigate('/one');
      await navigate('/two');

      expect(clone?.tagName.toLowerCase()).toBe('gsap-page-one');
      expect(clone?.isConnected).toBe(true); // still on screen while animating

      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(clone?.isConnected).toBe(false);
    });

    it('removes the snapshot immediately when the transition returns nothing', async () => {
      let clone: HTMLElement | undefined;
      const { navigate } = await setup({ leave: ({ element }) => void (clone = element) });

      await navigate('/one');
      await navigate('/two');

      expect(clone).toBeTruthy();
      expect(clone?.isConnected).toBe(false);
    });

    it("keeps the caller's own onComplete", async () => {
      const onComplete = vi.fn();
      const { navigate } = await setup({
        leave: ({ element }) => gsap.to(element, { opacity: 0, duration: 0.2, onComplete }),
      });

      await navigate('/one');
      await navigate('/two');
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Cleanup must chain onto the caller's callback, not replace it.
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('marks the snapshot inert so it cannot be focused or read by assistive tech', async () => {
      let clone: HTMLElement | undefined;
      const { navigate } = await setup({ leave: ({ element }) => void (clone = element) });

      await navigate('/one');
      await navigate('/two');

      expect(clone?.getAttribute('aria-hidden')).toBe('true');
      expect(clone?.inert).toBe(true);
    });
  });

  describe('navigations that change no view', () => {
    it('never snapshots when a guard rejects the navigation', async () => {
      const leave = vi.fn();
      const { navigate } = await setup({ leave }, [
        { path: 'one', component: PageOne },
        { path: 'two', component: PageTwo, canActivate: [() => false] },
      ]);

      await navigate('/one');
      await navigate('/two');

      // Guards run before resolve, which is where the snapshot is taken — so a
      // rejected navigation never produces a ghost in the first place.
      expect(leave).not.toHaveBeenCalled();
      expect(document.querySelectorAll('[aria-hidden="true"]').length).toBe(0);
    });

    it('does not animate when only route params change', async () => {
      const enter = vi.fn();
      const { navigate } = await setup({ enter }, [{ path: 'user/:id', component: PageOne }]);

      await navigate('/user/1');
      enter.mockClear();
      await navigate('/user/2');

      // Angular reuses the component when the route config is unchanged, so no
      // view is swapped and there is nothing to animate.
      expect(enter).not.toHaveBeenCalled();
    });

    it('stays quiet when outletSelector matches nothing', async () => {
      const enter = vi.fn();
      const { navigate } = await setup({ enter, outletSelector: 'no-such-outlet' });

      await navigate('/one');
      await navigate('/two');

      // A misconfigured selector finds no view to animate; it must not throw.
      expect(enter).not.toHaveBeenCalled();
    });

    it('does nothing at all when no transitions are configured', async () => {
      const { navigate } = await setup({});

      await navigate('/one');
      await navigate('/two');

      expect(document.querySelectorAll('[aria-hidden="true"]').length).toBe(0);
    });
  });

  describe('environment', () => {
    it('does nothing at all on the server', async () => {
      const enter = vi.fn();
      const leave = vi.fn();

      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          provideRouter(routes),
          provideGsapRouteTransitions({ enter, leave, skipInitialTransition: false }),
        ],
      });

      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(Shell);
      fixture.detectChanges();
      await router.navigateByUrl('/one');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(enter).not.toHaveBeenCalled();
      expect(leave).not.toHaveBeenCalled();
    });

    it('cleans up an in-flight snapshot when the environment is destroyed', async () => {
      let clone: HTMLElement | undefined;
      const { navigate } = await setup({
        leave: ({ element }) => {
          clone = element;
          return gsap.to(element, { opacity: 0, duration: 5 });
        },
      });

      await navigate('/one');
      await navigate('/two');
      expect(clone?.isConnected).toBe(true);

      TestBed.resetTestingModule();

      expect(clone?.isConnected).toBe(false);
    });
  });
});
