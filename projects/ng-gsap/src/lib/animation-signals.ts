import type { Signal } from '@angular/core';
import { DestroyRef, Injector, assertInInjectionContext, inject, signal } from '@angular/core';
import type { gsap } from 'gsap';
import { chainEventCallback } from './internal/chain-event-callback';

export interface AnimationSignalsOptions {
  /**
   * Kill the animation when the injection context is destroyed. On by default,
   * since the common case is an animation this component owns. Turn it off when
   * you're mirroring an animation whose lifetime is somebody else's problem.
   */
  killOnDestroy?: boolean;
  /** Required only when calling outside an injection context. */
  injector?: Injector;
}

export interface AnimationSignals {
  readonly progress: Signal<number>;
  readonly isActive: Signal<boolean>;
  readonly duration: Signal<number>;
}

/**
 * Mirrors a Tween or Timeline's playback state as readonly signals, so a
 * progress bar is just a template binding instead of a hand-wired `onUpdate`.
 *
 * @example
 * private timeline = gsap.timeline().to('.box', { x: 200 });
 * protected playback = animationSignals(this.timeline);
 * // <progress [value]="playback.progress()"></progress>
 */
export function animationSignals(
  animation: gsap.core.Animation,
  options: AnimationSignalsOptions = {},
): AnimationSignals {
  if (!options.injector) {
    assertInInjectionContext(animationSignals);
  }
  const injector = options.injector ?? inject(Injector);
  const { killOnDestroy = true } = options;

  const progress = signal(animation.progress());
  const isActive = signal(animation.isActive());
  const duration = signal(animation.duration());

  const sync = () => {
    progress.set(animation.progress());
    isActive.set(animation.isActive());
    duration.set(animation.duration());
  };

  const teardowns = [
    chainEventCallback(animation, 'onUpdate', sync),
    chainEventCallback(animation, 'onComplete', sync),
    chainEventCallback(animation, 'onReverseComplete', sync),
  ];

  injector.get(DestroyRef).onDestroy(() => {
    teardowns.forEach((stop) => stop());
    if (killOnDestroy) {
      animation.kill();
    }
  });

  return {
    progress: progress.asReadonly(),
    isActive: isActive.asReadonly(),
    duration: duration.asReadonly(),
  };
}
