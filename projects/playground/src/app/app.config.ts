import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from 'ng-gsap';
import { provideGsapRouteTransitions } from 'ng-gsap/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideClientHydration(),

    provideGsap({
      plugins: [ScrollTrigger],
      defaults: { ease: 'power2.out', duration: 0.6 },
      respectReducedMotion: true,
    }),

    // This site animates its own page transitions with the library's router
    // entry point. Enter only: a `leave` snapshot is briefly a second copy of
    // the outgoing page in the DOM, which is fine visually but would make the
    // end-to-end selectors ambiguous.
    provideGsapRouteTransitions({
      enter: ({ element }) =>
        gsap.from(element, { autoAlpha: 0, y: 12, duration: 0.28, ease: 'power2.out' }),
    }),
  ],
};
