import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Every page is prerendered to static HTML at build time, which is what makes
 * this deployable to GitHub Pages. It doubles as the SSR test: the whole app is
 * rendered in Node, with no DOM, on every single build. If anything in ng-gsap
 * touched the DOM outside the browser render phase, this build would fail.
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
