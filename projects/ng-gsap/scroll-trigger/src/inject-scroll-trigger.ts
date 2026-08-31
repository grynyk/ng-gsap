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
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type ScrollTriggerTarget =
  ElementRef<Element> | Element | Signal<ElementRef<Element> | Element | undefined | null>;

export interface InjectScrollTriggerOptions extends Omit<
  ScrollTrigger.StaticVars,
  'trigger' | 'onUpdate' | 'onToggle'
> {
  /** The element to track. Pass a `viewChild()` signal and it re-creates itself if the element changes. */
  trigger?: ScrollTriggerTarget;
  /** Required only when calling outside an injection context. */
  injector?: Injector;
}

export interface ScrollTriggerHandle {
  /** 0 → 1 across the trigger's start/end range. */
  readonly progress: Signal<number>;
  readonly isActive: Signal<boolean>;
  /** 1 scrolling forward, -1 scrolling back. */
  readonly direction: Signal<number>;
  /**
   * The live ScrollTrigger, for imperative work like `refresh()`. `undefined`
   * before the first render, after destroy, and in environments that can't run
   * ScrollTrigger at all (see `isSupported`).
   */
  readonly instance: Signal<ScrollTrigger | undefined>;
  /**
   * `false` during server-side rendering and under jsdom, where there is no
   * layout to measure. The handle stays inert rather than throwing, so a
   * component using this is still safe to unit-test.
   */
  readonly isSupported: boolean;
}

/**
 * ScrollTrigger needs a real window with `matchMedia` and real layout. Neither
 * SSR nor jsdom provides that, and `registerPlugin` throws outright without
 * `matchMedia` — so detect it up front instead of exploding at injection time.
 */
function scrollTriggerIsSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function resolveTarget(target: ScrollTriggerTarget | undefined): Element | undefined {
  const value = isSignal(target) ? target() : target;
  if (!value) {
    return undefined;
  }
  return value instanceof Element ? value : value.nativeElement;
}

/**
 * Mirrors a ScrollTrigger's `progress` / `isActive` / `direction` as signals, so
 * scroll-driven UI is a template binding instead of a callback. Registers the
 * plugin for you, re-creates the trigger when a signal `trigger` changes, and
 * kills it on destroy.
 *
 * @example
 * private section = viewChild.required<ElementRef>('section');
 * protected scroll = injectScrollTrigger({
 *   trigger: this.section,
 *   start: 'top center',
 *   end: 'bottom center',
 * });
 * // <div [style.opacity]="scroll.progress()">
 */
export function injectScrollTrigger(options: InjectScrollTriggerOptions = {}): ScrollTriggerHandle {
  if (!options.injector) {
    assertInInjectionContext(injectScrollTrigger);
  }
  const injector = options.injector ?? inject(Injector);

  const { trigger, injector: _injector, ...staticVars } = options;

  const progress = signal(0);
  const isActive = signal(false);
  const direction = signal(1);
  const instance = signal<ScrollTrigger | undefined>(undefined);
  const isSupported = scrollTriggerIsSupported();

  if (isSupported) {
    gsap.registerPlugin(ScrollTrigger);

    afterRenderEffect(
      {
        write: (onCleanup) => {
          const st = ScrollTrigger.create({
            ...staticVars,
            trigger: resolveTarget(trigger),
            onUpdate: (self) => {
              progress.set(self.progress);
              direction.set(self.direction);
            },
            // Only fires when the trigger enters or leaves its range, which
            // needs real scrolling — covered by the browser run and e2e, not jsdom.
            onToggle: (self) => isActive.set(self.isActive),
          });

          progress.set(st.progress);
          isActive.set(st.isActive);
          instance.set(st);

          onCleanup(() => {
            st.kill();
            instance.set(undefined);
          });
        },
      },
      { injector },
    );
  }

  return {
    progress: progress.asReadonly(),
    isActive: isActive.asReadonly(),
    direction: direction.asReadonly(),
    instance: instance.asReadonly(),
    isSupported,
  };
}
