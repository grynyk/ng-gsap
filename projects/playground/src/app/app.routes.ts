import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },

  // Docs
  {
    path: 'docs/getting-started',
    loadComponent: () =>
      import('./docs/getting-started/getting-started').then((m) => m.GettingStarted),
  },
  { path: 'docs/api', loadComponent: () => import('./docs/api/api').then((m) => m.Api) },
  {
    path: 'docs/guides',
    loadComponent: () => import('./docs/guides/guides').then((m) => m.Guides),
  },
  { path: 'docs', redirectTo: 'docs/getting-started', pathMatch: 'full' },

  // Examples
  {
    path: 'basic-tween',
    loadComponent: () => import('./examples/basic-tween/basic-tween').then((m) => m.BasicTween),
  },
  {
    path: 'timeline',
    loadComponent: () => import('./examples/timeline/timeline').then((m) => m.Timeline),
  },
  {
    path: 'context-safe',
    loadComponent: () => import('./examples/context-safe/context-safe').then((m) => m.ContextSafe),
  },
  {
    path: 'scrubber',
    loadComponent: () => import('./examples/scrubber/scrubber').then((m) => m.Scrubber),
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./examples/signal-driven-list/signal-driven-list').then((m) => m.SignalDrivenList),
  },
  {
    path: 'scroll-progress',
    loadComponent: () =>
      import('./examples/scroll-progress/scroll-progress').then((m) => m.ScrollProgress),
  },
  {
    path: 'scroll-pin',
    loadComponent: () => import('./examples/scroll-pin/scroll-pin').then((m) => m.ScrollPin),
  },
  {
    path: 'smooth-scroll',
    loadComponent: () =>
      import('./examples/smooth-scroll/smooth-scroll').then((m) => m.SmoothScroll),
  },
  {
    path: 'text-reveal',
    loadComponent: () => import('./examples/text-reveal/text-reveal').then((m) => m.TextReveal),
  },
  {
    path: 'flip-grid',
    loadComponent: () => import('./examples/flip-grid/flip-grid').then((m) => m.FlipGrid),
  },
  {
    path: 'svg-draw',
    loadComponent: () => import('./examples/svg-draw/svg-draw').then((m) => m.SvgDraw),
  },

  { path: '**', redirectTo: '' },
];
