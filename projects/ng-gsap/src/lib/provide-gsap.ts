import type { EnvironmentProviders } from '@angular/core';
import {
  DestroyRef,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { gsap } from 'gsap';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Rather than cancelling animations outright (which strands elements on their
// `from` values), reduced motion runs the global timeline fast enough that every
// tween lands on its end state within a frame. Callbacks and ScrollTrigger
// scrubs keep working; only the perceived motion goes away.
const REDUCED_MOTION_TIME_SCALE = 100;

export interface GsapConfig {
  /** Plugins to register once, app-wide (e.g. ScrollTrigger, Flip, SplitText). */
  plugins?: object[];
  /** Applied via `gsap.defaults()` so every tween and timeline inherits them. */
  defaults?: gsap.TweenVars;
  /**
   * Collapse animation to its end state while the OS reports
   * `prefers-reduced-motion: reduce`, and restore it if the user changes that
   * setting mid-session. Off by default so it stays an explicit choice.
   */
  respectReducedMotion?: boolean;
}

export const GSAP_CONFIG = new InjectionToken<GsapConfig>('ng-gsap.config');

function watchReducedMotion(): void {
  // No matchMedia on the server or under jsdom — nothing to honour there.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }

  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const sync = () => gsap.globalTimeline.timeScale(query.matches ? REDUCED_MOTION_TIME_SCALE : 1);

  sync();
  query.addEventListener('change', sync);

  inject(DestroyRef).onDestroy(() => {
    query.removeEventListener('change', sync);
    gsap.globalTimeline.timeScale(1);
  });
}

/**
 * App-wide GSAP setup: registers plugins and applies default tween vars once, at
 * bootstrap. Only pass the plugins you actually use so the rest stay tree-shaken
 * out of your bundle.
 *
 * @example
 * providers: [
 *   provideGsap({
 *     plugins: [ScrollTrigger],
 *     defaults: { ease: 'power2.out', duration: 0.6 },
 *     respectReducedMotion: true,
 *   }),
 * ]
 */
export function provideGsap(config: GsapConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GSAP_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => {
      const { plugins, defaults, respectReducedMotion } = inject(GSAP_CONFIG);

      if (plugins?.length) {
        gsap.registerPlugin(...plugins);
      }
      if (defaults) {
        gsap.defaults(defaults);
      }
      if (respectReducedMotion) {
        watchReducedMotion();
      }
    }),
  ]);
}
