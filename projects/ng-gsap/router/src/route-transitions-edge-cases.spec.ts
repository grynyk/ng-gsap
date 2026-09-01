import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Routes } from '@angular/router';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { advanceGsap, provideGsapTesting } from '../../testing/src/provide-gsap-testing';
import { provideGsapRouteTransitions } from './provide-gsap-route-transitions';

@Component({ selector: 'gsap-alpha', template: '<p>alpha</p>' })
class Alpha {}

@Component({ selector: 'gsap-beta', template: '<p>beta</p>' })
class Beta {}

@Component({ selector: 'gsap-lazy', template: '<p>lazy</p>' })
class Lazy {}

@Component({ selector: 'gsap-shell', imports: [RouterOutlet], template: '<router-outlet />' })
class Shell {}

const routes: Routes = [
  { path: 'alpha', component: Alpha },
  { path: 'beta', component: Beta },
  { path: 'lazy', loadComponent: () => Promise.resolve(Lazy) },
  { path: 'old', redirectTo: 'beta' },
  { path: 'user/:id', component: Alpha },
];

async function setup(config: Parameters<typeof provideGsapRouteTransitions>[0]) {
  TestBed.configureTestingModule({
    // Frozen gsap: these assert on animation state without racing real time.
    providers: [provideGsapTesting(), provideRouter(routes), provideGsapRouteTransitions(config)],
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

const snapshotsInDocument = () => document.querySelectorAll('[aria-hidden="true"]').length;

describe('provideGsapRouteTransitions — edge cases', () => {
  afterEach(() => {
    document.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  });

  it('handles a lazy-loaded route', async () => {
    const enter = vi.fn();
    const { navigate } = await setup({ enter });

    await navigate('/alpha');
    await navigate('/lazy');

    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0][0].element.tagName.toLowerCase()).toBe('gsap-lazy');
  });

  it('follows a redirect to the destination it actually landed on', async () => {
    const enter = vi.fn();
    const { navigate } = await setup({ enter });

    await navigate('/alpha');
    await navigate('/old');

    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0][0].to).toBe('/beta');
    expect(enter.mock.calls[0][0].element.tagName.toLowerCase()).toBe('gsap-beta');
  });

  it('ignores a navigation to the URL already showing', async () => {
    const enter = vi.fn();
    const leave = vi.fn();
    const { navigate } = await setup({ enter, leave });

    await navigate('/alpha');
    enter.mockClear();
    leave.mockClear();

    await navigate('/alpha');

    expect(enter).not.toHaveBeenCalled();
    expect(leave).not.toHaveBeenCalled();
  });

  it('ignores a query-parameter-only change', async () => {
    const enter = vi.fn();
    const { navigate } = await setup({ enter });

    await navigate('/user/1?tab=a');
    enter.mockClear();
    await navigate('/user/1?tab=b');

    expect(enter).not.toHaveBeenCalled();
  });

  it('survives rapid consecutive navigations without leaking snapshots', async () => {
    const { fixture, router } = await setup({
      leave: ({ element }) => gsap.to(element, { opacity: 0, duration: 0.15 }),
    });

    // Fire several navigations without awaiting each one settling.
    await Promise.all([
      router.navigateByUrl('/alpha'),
      router.navigateByUrl('/beta'),
      router.navigateByUrl('/alpha'),
      router.navigateByUrl('/beta'),
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    advanceGsap(200); // past the 0.15s leave animations

    expect(snapshotsInDocument()).toBe(0);
  });

  it('cleans up when a navigation interrupts an in-flight leave animation', async () => {
    const { navigate } = await setup({
      leave: ({ element }) => gsap.to(element, { opacity: 0, duration: 3 }),
    });

    await navigate('/alpha');
    await navigate('/beta');
    expect(snapshotsInDocument()).toBeGreaterThan(0);

    await navigate('/alpha');
    TestBed.resetTestingModule();

    expect(snapshotsInDocument()).toBe(0);
  });

  it('does not leak snapshots across many navigations', async () => {
    const { navigate } = await setup({
      leave: ({ element }) => gsap.to(element, { opacity: 0, duration: 0.05 }),
    });

    for (let i = 0; i < 12; i++) {
      await navigate(i % 2 === 0 ? '/alpha' : '/beta');
    }
    advanceGsap(200);

    expect(snapshotsInDocument()).toBe(0);
  });

  it('keeps the snapshot out of the accessibility tree and the tab order', async () => {
    let clone: HTMLElement | undefined;
    const { navigate } = await setup({
      leave: ({ element }) => {
        clone = element;
        return gsap.to(element, { opacity: 0, duration: 1 });
      },
    });

    await navigate('/alpha');
    await navigate('/beta');

    expect(clone?.inert).toBe(true);
    expect(clone?.getAttribute('aria-hidden')).toBe('true');
    // pointer-events must be off so the ghost cannot swallow clicks
    expect(clone?.style.pointerEvents).toBe('none');
  });

  it('reports depth 0 for a flat route tree', async () => {
    const seen: number[] = [];
    const { navigate } = await setup({ enter: ({ depth }) => void seen.push(depth) });

    await navigate('/alpha');
    await navigate('/beta');

    expect(seen).toEqual([0]);
  });

  it('animates going back through history', async () => {
    const enter = vi.fn();
    const { fixture, router, navigate } = await setup({ enter });

    await navigate('/alpha');
    await navigate('/beta');
    enter.mockClear();

    await router.navigateByUrl('/alpha', { replaceUrl: false });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0][0].element.tagName.toLowerCase()).toBe('gsap-alpha');
  });

  it('keeps working after a transition callback throws', async () => {
    const enter = vi.fn();
    let explode = true;
    const { navigate } = await setup({
      enter,
      leave: () => {
        if (explode) {
          throw new Error('caller bug');
        }
      },
    });

    await navigate('/alpha');
    await navigate('/beta'); // leave throws here
    explode = false;
    enter.mockClear();

    // A bug in the caller's callback must not permanently disable transitions:
    // an uncaught throw inside an RxJS next handler tears down the subscription.
    await navigate('/alpha');

    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('removes the snapshot even if the leave callback throws', async () => {
    const { navigate } = await setup({
      leave: () => {
        throw new Error('caller bug');
      },
    });

    await navigate('/alpha');
    await navigate('/beta');

    expect(snapshotsInDocument()).toBe(0);
  });
});
