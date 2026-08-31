import {
  ElementRef,
  Injector,
  Signal,
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
  /** Element (or signal of one, e.g. from `viewChild()`) that scopes selector text inside the callback. */
  scope?: GsapScope;
  injector?: Injector;
}

export interface GsapHandle {
  /** The gsap.Context currently backing this callback, if the scope has resolved. */
  readonly context: Signal<gsap.Context | undefined>;
  /**
   * Wrap an event handler created outside the reactive callback (e.g. a
   * `(click)` binding) so any tweens it creates are tracked by the same
   * context and get reverted along with everything else.
   */
  contextSafe<T extends (...args: unknown[]) => unknown>(fn: T): T;
}

function resolveScope(scope: GsapScope): Element | undefined {
  const value = isSignal(scope) ? scope() : scope;
  if (!value) {
    return undefined;
  }
  return value instanceof Element ? value : value.nativeElement;
}

/**
 * The core primitive: runs `callback` inside a `gsap.context()`, auto-reverting
 * on every re-run and on destroy. Unlike `@gsap/react`'s `useGSAP`, there is no
 * dependency array to maintain — `callback` runs inside an Angular render effect,
 * so any signal read inside it becomes a live dependency automatically. It also
 * runs in the `write` phase of the render lifecycle (SSR no-ops, no layout thrashing,
 * no manual platform checks).
 *
 * @example
 * private container = viewChild.required<ElementRef>('container');
 * private open = signal(false);
 * private anim = injectGSAP(() => {
 *   gsap.to('.box', { x: this.open() ? 200 : 0 }); // reading open() here IS the dependency
 * }, { scope: this.container });
 */
export function injectGSAP(callback: (context: gsap.Context) => void, options: InjectGsapOptions = {}): GsapHandle {
  if (!options.injector) {
    assertInInjectionContext(injectGSAP);
  }
  const injector = options.injector ?? inject(Injector);

  let activeContext: gsap.Context | undefined;
  const contextSignal = signal<gsap.Context | undefined>(undefined);

  afterRenderEffect(
    {
      write: (onCleanup) => {
        const scopeEl = resolveScope(options.scope);
        const ctx = gsap.context((self) => callback(self as gsap.Context), scopeEl);
        activeContext = ctx;
        contextSignal.set(ctx);

        onCleanup(() => {
          ctx.revert();
          if (activeContext === ctx) {
            activeContext = undefined;
          }
        });
      },
    },
    { injector },
  );

  return {
    context: contextSignal.asReadonly(),
    contextSafe: <T extends (...args: unknown[]) => unknown>(fn: T): T =>
      ((...args: Parameters<T>) => {
        if (!activeContext) {
          return fn(...args);
        }
        let result: ReturnType<T>;
        activeContext.add(() => {
          result = fn(...args) as ReturnType<T>;
        });
        return result!;
      }) as T,
  };
}
