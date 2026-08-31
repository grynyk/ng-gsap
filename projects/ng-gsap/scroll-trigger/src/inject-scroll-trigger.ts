import { ElementRef, Injector, Signal, afterRenderEffect, assertInInjectionContext, inject, isSignal, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type ScrollTriggerTarget = ElementRef<Element> | Element | Signal<ElementRef<Element> | Element | undefined | null>;

export interface InjectScrollTriggerOptions extends Omit<ScrollTrigger.StaticVars, 'trigger' | 'onUpdate' | 'onToggle'> {
  trigger?: ScrollTriggerTarget;
  injector?: Injector;
}

export interface ScrollTriggerHandle {
  readonly progress: Signal<number>;
  readonly isActive: Signal<boolean>;
  readonly direction: Signal<number>;
  readonly instance: Signal<ScrollTrigger | undefined>;
}

function resolveTarget(target: ScrollTriggerTarget | undefined): Element | undefined {
  const value = isSignal(target) ? target() : target;
  if (!value) {
    return undefined;
  }
  return value instanceof Element ? value : value.nativeElement;
}

/**
 * Wires up a ScrollTrigger and mirrors its progress/isActive/direction as
 * signals. Registers the ScrollTrigger plugin automatically, re-creates the
 * trigger if `trigger` is a signal that changes, and kills it on destroy —
 * no manual cleanup required.
 *
 * @example
 * const { progress, isActive } = injectScrollTrigger({ trigger: section, start: 'top center' });
 */
export function injectScrollTrigger(options: InjectScrollTriggerOptions = {}): ScrollTriggerHandle {
  if (!options.injector) {
    assertInInjectionContext(injectScrollTrigger);
  }
  const injector = options.injector ?? inject(Injector);
  gsap.registerPlugin(ScrollTrigger);

  const { trigger, injector: _injector, ...staticVars } = options;

  const progress = signal(0);
  const isActive = signal(false);
  const direction = signal(1);
  const instance = signal<ScrollTrigger | undefined>(undefined);

  afterRenderEffect(
    {
      write: (onCleanup) => {
        const triggerEl = resolveTarget(trigger);

        const st = ScrollTrigger.create({
          ...staticVars,
          trigger: triggerEl,
          onUpdate: (self) => {
            progress.set(self.progress);
            direction.set(self.direction);
          },
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

  return {
    progress: progress.asReadonly(),
    isActive: isActive.asReadonly(),
    direction: direction.asReadonly(),
    instance: instance.asReadonly(),
  };
}
