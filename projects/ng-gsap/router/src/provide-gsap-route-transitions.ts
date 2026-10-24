import { isPlatformBrowser } from '@angular/common';
import type { EnvironmentProviders } from '@angular/core';
import {
  DOCUMENT,
  DestroyRef,
  ErrorHandler,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  ResolveEnd,
  Router,
} from '@angular/router';
import { gsap } from 'gsap';

export interface RouteTransitionContext {
  /**
   * The routed view's host element. For `leave` this is a detached snapshot of
   * the outgoing view, not the live one — see the note on `leave` below.
   */
  readonly element: HTMLElement;
  /**
   * How deep in the outlet tree this view sits. `0` is the top-level outlet, `1`
   * a view rendered into an outlet inside it, and so on. Useful for animating
   * shell changes differently from changes within a section.
   */
  readonly depth: number;
  /** URL being navigated away from. Empty on the first navigation. */
  readonly from: string;
  /** URL being navigated to. */
  readonly to: string;
}

export type RouteTransition = (
  context: RouteTransitionContext,
) => gsap.core.Animation | void | undefined;

export interface GsapRouteTransitionsConfig {
  /** Runs on the incoming view's host element, once it is in the DOM. */
  enter?: RouteTransition;
  /**
   * Runs on a snapshot of the outgoing view, layered over the incoming one.
   *
   * Angular's router does not wait for animations before destroying a view, so
   * rather than blocking navigation this clones the outgoing element into a
   * fixed-position overlay and animates that. The clone keeps its classes and
   * inline styles, so it looks identical; what it cannot carry over is live
   * state — canvas contents, video playback position, and uncommitted form
   * input. If that matters for a given view, animate only on `enter`.
   */
  leave?: RouteTransition;
  /**
   * How to find router outlets in the DOM. Defaults to `'router-outlet'`.
   *
   * Nesting is handled automatically: the outlet tree is walked to whatever
   * depth the navigation actually changed, so a child navigation animates the
   * child view rather than the whole shell. Narrow this only if you have
   * sibling outlets at the same level and need to pick one.
   */
  outletSelector?: string;
  /** Skip the enter animation for the first view the app renders. Defaults to `true`. */
  skipInitialTransition?: boolean;
}

export const GSAP_ROUTE_TRANSITIONS = new InjectionToken<GsapRouteTransitionsConfig>(
  'ng-gsap.route-transitions',
);

const OVERLAY_STYLE = {
  position: 'fixed',
  margin: '0',
  pointerEvents: 'none',
  zIndex: '2147483646',
} as const;

/**
 * The chain of routed views currently in the DOM, outermost first.
 *
 * A routed component renders as its outlet's next sibling, and an outlet for a
 * child route lives inside that sibling — so following that pattern down gives
 * one element per active outlet depth.
 */
function viewChain(root: ParentNode, outletSelector: string): HTMLElement[] {
  const views: HTMLElement[] = [];
  let scope: ParentNode | null = root;

  while (scope) {
    const view: Element | null | undefined =
      scope.querySelector(outletSelector)?.nextElementSibling;
    if (!(view instanceof HTMLElement)) {
      break;
    }
    views.push(view);
    scope = view;
  }

  return views;
}

/** The chain of route configs a snapshot activates, outermost first. */
function routeChain(root: ActivatedRouteSnapshot | null): (object | null)[] {
  const configs: (object | null)[] = [];

  for (let route = root?.firstChild ?? null; route; route = route.firstChild) {
    configs.push(route.routeConfig);
  }

  return configs;
}

/**
 * The shallowest outlet depth whose route is actually changing, or `-1` when
 * nothing is. Angular reuses a component when its route config is unchanged, so
 * a navigation that only alters params swaps no views and animates nothing.
 */
function changedDepth(current: RouterStateSnapshot, next: RouterStateSnapshot): number {
  const before = routeChain(current.root);
  const after = routeChain(next.root);

  for (let depth = 0; depth < Math.max(before.length, after.length); depth++) {
    if (before[depth] !== after[depth]) {
      return depth;
    }
  }

  return -1;
}

/**
 * Clones the outgoing view and pins the clone exactly where the original sat,
 * so it can be animated out after the router has already replaced the original.
 */
function snapshotOf(element: HTMLElement): HTMLElement {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true) as HTMLElement;

  Object.assign(clone.style, OVERLAY_STYLE, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;

  return clone;
}

/** Transform values that have no visual effect: none, identity, zero translate. */
const INERT_TRANSFORM =
  /^(none|matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)|translate\(\s*0(?:px)?\s*,\s*0(?:px)?\s*\))$/;

/**
 * Strips a transform that GSAP left behind once it no longer does anything.
 *
 * A finished `gsap.from(element, { y: 24 })` settles on
 * `transform: translate(0px, 0px)` — visually identical to no transform, but
 * **any** transform other than `none` makes the element a containing block for
 * `position: fixed` descendants. That silently breaks ScrollTrigger pins
 * anywhere inside the routed view, which is a genuinely baffling bug to hit.
 *
 * Reads the inline value rather than the computed one so it behaves the same
 * under jsdom, and leaves a transform the caller actually meant to keep.
 *
 * Removes the properties directly rather than going through
 * `gsap.set({ clearProps })`: a `gsap.set` is a zero-duration tween on the
 * global timeline, so it silently does nothing whenever that timeline is
 * paused — which is exactly what `ng-gsap/testing` does. Touching the style
 * declaration works regardless of gsap's clock.
 */
const TRANSFORM_PROPERTIES = ['transform', 'translate', 'rotate', 'scale'] as const;

function clearInertTransform(element: HTMLElement): void {
  const inline = element.style.transform;

  if (!element.isConnected || !inline || !INERT_TRANSFORM.test(inline.trim())) {
    return;
  }
  for (const property of TRANSFORM_PROPERTIES) {
    element.style.removeProperty(property);
  }
}

/**
 * The events after which an animation will not move on its own again. Waiting
 * for `onComplete` alone stranded the snapshot whenever the animation was
 * reversed, or killed before it finished — which is what `killTweensOf` and a
 * `gsap.context` revert do to an in-flight leave, and gsap reports as
 * `onInterrupt`.
 */
const SETTLING_EVENTS = ['onComplete', 'onReverseComplete', 'onInterrupt'] as const;

type EventCallback = (this: unknown, ...args: unknown[]) => void;

/** Already on its final frame, so none of the settling events will ever fire. */
function hasFinished(animation: gsap.core.Animation): boolean {
  return animation.reversed() ? animation.totalProgress() === 0 : animation.totalProgress() === 1;
}

/**
 * `onSettled` may run more than once — an animation can complete and later be
 * reversed back to its start — so it has to be idempotent. Both callers are:
 * removing a removed element and clearing a cleared transform are no-ops.
 */
function runTransition(
  transition: RouteTransition | undefined,
  context: RouteTransitionContext,
  reportError: (error: unknown) => void,
  onSettled?: () => void,
): void {
  let animation: gsap.core.Animation | void | undefined;

  try {
    animation = transition?.(context);
  } catch (error) {
    // A bug in the caller's callback must not strand a snapshot on screen
    // forever, nor tear down the router subscription and silently disable every
    // later transition. Clean up, then hand the error to Angular's ErrorHandler
    // so it surfaces the way the rest of the application's errors do.
    onSettled?.();
    reportError(error);
    return;
  }

  if (!onSettled) {
    return;
  }
  if (!animation || hasFinished(animation)) {
    onSettled();
    return;
  }

  for (const type of SETTLING_EVENTS) {
    // gsap stores exactly one callback per event, so assigning would silently
    // discard one the caller set on their own animation. Chain instead, and
    // pass the caller's callback the `callbackScope` and params gsap gives us.
    const existing = animation.eventCallback(type) as EventCallback | null;
    animation.eventCallback(type, function (this: unknown, ...args: unknown[]) {
      existing?.apply(this, args);
      onSettled();
    });
  }
}

/**
 * Animates routed views in and out with GSAP, app-wide, without touching a
 * single component. Enter animations run on the real incoming element; leave
 * animations run on a pinned snapshot of the outgoing one (see `leave`).
 *
 * Nested routes are handled: each navigation animates the view at the outlet
 * depth that actually changed, so moving between two children of a section
 * animates the child rather than re-animating the whole shell.
 *
 * Server-side rendering is a no-op — there is nothing to animate and no DOM to
 * clone — and if `provideGsap({ respectReducedMotion: true })` is on, these
 * transitions collapse along with every other animation.
 *
 * @example
 * providers: [
 *   provideRouter(routes),
 *   provideGsap(),
 *   provideGsapRouteTransitions({
 *     enter: ({ element }) => gsap.from(element, { autoAlpha: 0, y: 24, duration: 0.4 }),
 *     leave: ({ element }) => gsap.to(element, { autoAlpha: 0, duration: 0.3 }),
 *   }),
 * ]
 */
export function provideGsapRouteTransitions(
  config: GsapRouteTransitionsConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GSAP_ROUTE_TRANSITIONS, useValue: config },
    provideEnvironmentInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return;
      }

      const {
        enter,
        leave,
        outletSelector = 'router-outlet',
        skipInitialTransition = true,
      } = inject(GSAP_ROUTE_TRANSITIONS);

      if (!enter && !leave) {
        return;
      }

      const router = inject(Router);
      const injector = inject(Injector);
      const document = inject(DOCUMENT);
      const errorHandler = inject(ErrorHandler);
      const reportError = (error: unknown) => errorHandler.handleError(error);

      let previousUrl = '';
      let isFirstNavigation = true;
      let pendingDepth = -1;

      // Snapshots currently animating out. Tracked so a navigation that is
      // cancelled after resolve doesn't strand a ghost over unchanged content.
      const pendingSnapshots = new Set<HTMLElement>();
      const discardSnapshots = () => {
        for (const element of pendingSnapshots) {
          gsap.killTweensOf(element);
          element.remove();
        }
        pendingSnapshots.clear();
      };

      const subscription = router.events.subscribe((event) => {
        // ResolveEnd is the last event before the router swaps views: guards and
        // resolvers have run, the incoming state is known, and the outgoing DOM
        // is still on screen — the only moment a leave snapshot can be taken.
        if (event instanceof ResolveEnd) {
          pendingDepth = changedDepth(router.routerState.snapshot, event.state);

          const outgoing = viewChain(document, outletSelector)[pendingDepth];
          if (!leave || pendingDepth < 0 || !outgoing) {
            return;
          }

          const clone = snapshotOf(outgoing);
          pendingSnapshots.add(clone);
          document.body.appendChild(clone);

          runTransition(
            leave,
            { element: clone, depth: pendingDepth, from: previousUrl, to: event.urlAfterRedirects },
            reportError,
            () => {
              pendingSnapshots.delete(clone);
              clone.remove();
            },
          );
          return;
        }

        // The view never changed, so any snapshot is a ghost over live content.
        if (event instanceof NavigationCancel || event instanceof NavigationError) {
          discardSnapshots();
          pendingDepth = -1;
          return;
        }

        if (!(event instanceof NavigationEnd)) {
          return;
        }

        const from = previousUrl;
        const to = event.urlAfterRedirects;
        const depth = pendingDepth;
        const skip = isFirstNavigation && skipInitialTransition;

        previousUrl = to;
        isFirstNavigation = false;
        pendingDepth = -1;

        if (!enter || skip || depth < 0) {
          return;
        }

        // NavigationEnd fires before the new view is necessarily painted.
        afterNextRender(
          () => {
            const incoming = viewChain(document, outletSelector)[depth];
            if (incoming) {
              runTransition(enter, { element: incoming, depth, from, to }, reportError, () =>
                clearInertTransform(incoming),
              );
            }
          },
          { injector },
        );
      });

      inject(DestroyRef).onDestroy(() => {
        subscription.unsubscribe();
        discardSnapshots();
      });
    }),
  ]);
}
