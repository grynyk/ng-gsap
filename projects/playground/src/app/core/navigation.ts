export interface NavItem {
  readonly path: string;
  readonly label: string;
  /** One-line summary, shown on the home page cards. */
  readonly summary: string;
}

export interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

/**
 * Single source of truth for the sidebar, the home page index, and the
 * end-to-end tests. Adding an example here and in app.routes.ts is all it takes
 * for it to appear everywhere.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'Docs',
    items: [
      {
        path: '/docs/getting-started',
        label: 'Getting started',
        summary: 'Install, provide, animate — the five-minute version',
      },
      {
        path: '/docs/api',
        label: 'API reference',
        summary: 'Every export, what it returns, and when to reach for it',
      },
      {
        path: '/docs/guides',
        label: 'Guides',
        summary: 'SSR, testing, route transitions, reduced motion',
      },
    ],
  },
  {
    title: 'Core',
    items: [
      {
        path: '/basic-tween',
        label: 'Basic tween',
        summary: 'injectGSAP + scope, with auto-tracked signal dependencies',
      },
      {
        path: '/timeline',
        label: 'Timeline',
        summary: 'A timeline rebuilt from scratch whenever its inputs change',
      },
      {
        path: '/context-safe',
        label: 'Event handlers',
        summary: "contextSafe, and when you genuinely don't need it",
      },
      {
        path: '/scrubber',
        label: 'Two-way scrubber',
        summary: 'gsapScrub binds a signal to a timeline in both directions',
      },
      {
        path: '/list',
        label: 'Signal-driven list',
        summary: 'Enter and leave driven by the list signal itself',
      },
    ],
  },
  {
    title: 'Scroll',
    items: [
      {
        path: '/scroll-progress',
        label: 'ScrollTrigger progress',
        summary: 'injectScrollTrigger turning scroll position into signals',
      },
      {
        path: '/scroll-pin',
        label: 'Pinned scroll story',
        summary: 'A pinned section whose chapters read progress() directly',
      },
    ],
  },
  {
    title: 'Plugins',
    items: [
      {
        path: '/text-reveal',
        label: 'Text reveal',
        summary: 'SplitText line-masked stagger',
      },
      {
        path: '/flip-grid',
        label: 'Flip grid',
        summary: 'Flip animates the diff after @for reorders the DOM',
      },
      {
        path: '/svg-draw',
        label: 'SVG draw-in',
        summary: 'DrawSVGPlugin, registered only where it is used',
      },
    ],
  },
];

export const EXAMPLE_SECTIONS = NAV_SECTIONS.filter((section) => section.title !== 'Docs');
