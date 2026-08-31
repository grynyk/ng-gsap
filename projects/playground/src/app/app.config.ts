import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGsap } from 'ng-gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideGsap({ plugins: [ScrollTrigger], defaults: { ease: 'power2.out', duration: 0.6 } }),
  ],
};
