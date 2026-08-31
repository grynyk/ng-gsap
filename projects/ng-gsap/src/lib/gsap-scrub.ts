import { DestroyRef, Injector, WritableSignal, assertInInjectionContext, effect, inject, signal } from '@angular/core';
import type { gsap } from 'gsap';
import { chainEventCallback } from './internal/chain-event-callback';

export interface GsapScrubOptions {
  injector?: Injector;
}

// Playback and the signal write can disagree by a hair of floating-point error
// without it meaning the user actually dragged the scrubber.
const EPSILON = 1e-4;

/**
 * Two-way binds a WritableSignal to a timeline's progress: writing the signal
 * (e.g. from `[(ngModel)]` on a range input) seeks the timeline, and the
 * timeline playing seeks the signal back. Bind it directly:
 *
 * @example
 * progress = gsapScrub(this.timeline);
 * // <input type="range" min="0" max="1" step="0.001" [(ngModel)]="progress" />
 */
export function gsapScrub(timeline: gsap.core.Timeline, options: GsapScrubOptions = {}): WritableSignal<number> {
  if (!options.injector) {
    assertInInjectionContext(gsapScrub);
  }
  const injector = options.injector ?? inject(Injector);

  const progress = signal(timeline.progress());

  chainEventCallback(timeline, 'onUpdate', () => progress.set(timeline.progress()));

  effect(
    () => {
      const value = progress();
      if (Math.abs(timeline.progress() - value) > EPSILON) {
        timeline.progress(value);
      }
    },
    { injector },
  );

  injector.get(DestroyRef).onDestroy(() => timeline.kill());

  return progress;
}
