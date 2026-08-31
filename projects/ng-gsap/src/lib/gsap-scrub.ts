import type { WritableSignal } from '@angular/core';
import {
  DestroyRef,
  Injector,
  assertInInjectionContext,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { gsap } from 'gsap';
import { chainEventCallback } from './internal/chain-event-callback';

export interface GsapScrubOptions {
  /** Kill the timeline when the injection context is destroyed. On by default. */
  killOnDestroy?: boolean;
  /** Required only when calling outside an injection context. */
  injector?: Injector;
}

// Playback and the signal write can disagree by a hair of floating-point error
// without the user having actually dragged the scrubber.
const EPSILON = 1e-4;

/**
 * Two-way binds a writable signal to a timeline's progress: writing the signal
 * seeks the timeline, and the timeline playing writes back to the signal. Bind
 * it straight to a range input.
 *
 * @example
 * protected progress = gsapScrub(this.timeline);
 * // <input type="range" min="0" max="1" step="0.001" [(ngModel)]="progress" />
 *
 * The loop between those two directions is broken with an epsilon comparison
 * rather than a re-entrancy flag. A flag doesn't work here: `effect()` flushes
 * asynchronously, so a synchronously-reset flag is already back to `false` by
 * the time the effect body runs. Comparing values works because the flush still
 * happens in the same tick, before playback can have drifted by more than
 * floating-point noise. Keep the reasoning intact if you touch this.
 */
export function gsapScrub(
  timeline: gsap.core.Timeline,
  options: GsapScrubOptions = {},
): WritableSignal<number> {
  if (!options.injector) {
    assertInInjectionContext(gsapScrub);
  }
  const injector = options.injector ?? inject(Injector);
  const { killOnDestroy = true } = options;

  const progress = signal(timeline.progress());

  const stopMirroring = chainEventCallback(timeline, 'onUpdate', () =>
    progress.set(timeline.progress()),
  );

  effect(
    () => {
      const value = progress();
      if (Math.abs(timeline.progress() - value) > EPSILON) {
        timeline.progress(value);
      }
    },
    { injector },
  );

  injector.get(DestroyRef).onDestroy(() => {
    stopMirroring();
    if (killOnDestroy) {
      timeline.kill();
    }
  });

  return progress;
}
