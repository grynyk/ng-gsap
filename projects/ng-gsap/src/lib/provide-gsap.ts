import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { gsap } from 'gsap';
import { GSAP_CONFIG, GsapConfig } from './tokens';

/**
 * App-wide GSAP setup: registers plugins and applies default tween vars once,
 * at bootstrap. Only pass the plugins you actually use so unused ones stay
 * tree-shaken out of the bundle.
 *
 * @example
 * providers: [
 *   provideGsap({ plugins: [ScrollTrigger], defaults: { ease: 'power2.out' } }),
 * ]
 */
export function provideGsap(config: GsapConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GSAP_CONFIG, useValue: config },
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const { plugins, defaults } = inject(GSAP_CONFIG);
        if (plugins?.length) {
          gsap.registerPlugin(...plugins);
        }
        if (defaults) {
          gsap.defaults(defaults);
        }
      },
    },
  ]);
}
