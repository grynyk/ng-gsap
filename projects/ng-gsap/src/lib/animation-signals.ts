import { DestroyRef, Injector, Signal, assertInInjectionContext, inject, signal } from '@angular/core';
import type { gsap } from 'gsap';
import { chainEventCallback } from './internal/chain-event-callback';

export interface AnimationSignalsOptions {
  injector?: Injector;
}

export interface AnimationSignals {
  readonly progress: Signal<number>;
  readonly isActive: Signal<boolean>;
  readonly duration: Signal<number>;
}

/**
 * Mirrors a gsap Tween/Timeline's playback state as readonly signals, so
 * progress bars and other UI can just read a signal instead of subscribing
 * to gsap's onUpdate callback by hand. Kills the animation on destroy.
 */
export function animationSignals(animation: gsap.core.Animation, options: AnimationSignalsOptions = {}): AnimationSignals {
  if (!options.injector) {
    assertInInjectionContext(animationSignals);
  }
  const injector = options.injector ?? inject(Injector);

  const progress = signal(animation.progress());
  const isActive = signal(animation.isActive());
  const duration = signal(animation.duration());

  const sync = () => {
    progress.set(animation.progress());
    isActive.set(animation.isActive());
    duration.set(animation.duration());
  };

  chainEventCallback(animation, 'onUpdate', sync);
  chainEventCallback(animation, 'onComplete', sync);
  chainEventCallback(animation, 'onReverseComplete', sync);

  injector.get(DestroyRef).onDestroy(() => animation.kill());

  return {
    progress: progress.asReadonly(),
    isActive: isActive.asReadonly(),
    duration: duration.asReadonly(),
  };
}
