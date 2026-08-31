import type { ElementRef, Signal } from '@angular/core';
import {
  Injector,
  afterRenderEffect,
  assertInInjectionContext,
  inject,
  isSignal,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';

export type GsapScopeElement = ElementRef<Element> | Element;
export type GsapScope = GsapScopeElement | Signal<GsapScopeElement | undefined | null> | undefined;

export interface InjectGsapOptions {
  /**
   * Element — or a signal of one, e.g. from `viewChild()` — that scopes every
   * selector string used inside the callback, so `'.box'` only ever matches
   * inside this component.
   */
  scope?: GsapScope;
  /** Required only when calling outside an injection context. */
  injector?: Injector;
}

export interface GsapHandle {
  /**
   * The `gsap.Context` currently backing the callback, or `undefined` before the
   * first render and after destroy. For imperative escape hatches; you rarely
   * need it.
   */
  readonly context: Signal<gsap.Context | undefined>;
  /**
   * Wraps a function created outside the reactive callback — a `(click)`
   * handler, a timer, a subscription — so the tweens it creates join the same
   * context and get reverted with everything else.
   *
   * Only needed for functions that *create animations*. Plain signal writes
   * don't need it: the callback re-runs and cleans up after itself anyway.
   */
  contextSafe<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R;
}

function resolveScope(scope: GsapScope): Element | undefined {
  const value = isSignal(scope) ? scope() : scope;
  if (!value) {
    return undefined;
  }
  return value instanceof Element ? value : value.nativeElement;
}

/**
 * Runs `callback` inside a `gsap.context()` wired to Angular's reactivity.
 *
 * **Every signal you read inside the callback becomes a live dependency.** Read
 * one, and the callback re-runs whenever it changes — there is no dependency
 * list to declare, and therefore none to forget. Everything the callback creates
 * belongs to a context that is reverted before each re-run and again on destroy,
 * so there is no teardown to write either.
 *
 * It runs in the `write` phase of the render lifecycle, which means the DOM is
 * already laid out, nothing thrashes layout, and the whole thing no-ops during
 * server-side rendering without an `isPlatformBrowser` check in sight.
 *
 * Reverting before every re-run is deliberate: a change re-animates from a
 * clean slate instead of layering new tweens over old ones. With dependencies
 * tracked automatically, re-runs are frequent enough that accumulating would be
 * a footgun.
 *
 * @example
 * private container = viewChild.required<ElementRef>('container');
 * protected open = signal(false);
 *
 * private anim = injectGSAP(() => {
 *   // `open` is read here, so this re-runs whenever it changes
 *   gsap.to('.box', { x: this.open() ? 220 : 0 });
 * }, { scope: this.container });
 */
export function injectGSAP(
  callback: (context: gsap.Context) => void,
  options: InjectGsapOptions = {},
): GsapHandle {
  if (!options.injector) {
    assertInInjectionContext(injectGSAP);
  }
  const injector = options.injector ?? inject(Injector);

  let activeContext: gsap.Context | undefined;
  const context = signal<gsap.Context | undefined>(undefined);

  afterRenderEffect(
    {
      write: (onCleanup) => {
        const ctx = gsap.context(
          (self) => callback(self as gsap.Context),
          resolveScope(options.scope),
        );
        activeContext = ctx;
        context.set(ctx);

        onCleanup(() => {
          ctx.revert();
          if (activeContext === ctx) {
            activeContext = undefined;
            context.set(undefined);
          }
        });
      },
    },
    { injector },
  );

  return {
    context: context.asReadonly(),
    contextSafe:
      <Args extends unknown[], R>(fn: (...args: Args) => R) =>
      (...args: Args): R => {
        if (!activeContext) {
          return fn(...args);
        }
        let result!: R;
        activeContext.add(() => {
          result = fn(...args);
        });
        return result;
      },
  };
}
