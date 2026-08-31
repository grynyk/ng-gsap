import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then((m) => m.Home) },
  {
    path: 'basic-tween',
    loadComponent: () => import('./examples/basic-tween/basic-tween').then((m) => m.BasicTween),
  },
  {
    path: 'hover',
    loadComponent: () => import('./examples/hover-directive/hover-directive').then((m) => m.HoverDirectiveExample),
  },
  {
    path: 'timeline',
    loadComponent: () => import('./examples/timeline-composition/timeline-composition').then((m) => m.TimelineComposition),
  },
  {
    path: 'scroll-progress',
    loadComponent: () => import('./examples/scroll-progress/scroll-progress').then((m) => m.ScrollProgress),
  },
  {
    path: 'scrubber',
    loadComponent: () => import('./examples/scrubber/scrubber').then((m) => m.Scrubber),
  },
  {
    path: 'svg-draw',
    loadComponent: () => import('./examples/svg-draw/svg-draw').then((m) => m.SvgDraw),
  },
  {
    path: 'list',
    loadComponent: () => import('./examples/signal-driven-list/signal-driven-list').then((m) => m.SignalDrivenList),
  },
];
