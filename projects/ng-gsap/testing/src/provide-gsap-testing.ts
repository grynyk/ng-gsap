import type { EnvironmentProviders } from '@angular/core';
import {
  DestroyRef,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { gsap } from 'gsap';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Total virtual time advanced since the current test environment was set up.
 * Kept in whole milliseconds and converted once per seek, so repeated calls
 * can't accumulate floating-point drift the way `time() + delta` would.
 */
let elapsedMilliseconds = 0;

/**
 * Freezes gsap for the duration of a test, so nothing moves except what you move
 * yourself with `advanceGsap()`. Playback is restored when the TestBed
 * environment is torn down, leaving global gsap state as it was found.
 *
 * It pauses the global timeline rather than stopping the ticker. Stopping the
 * ticker looks like it should work but doesn't: gsap wakes it again the moment
 * any new animation is created, so tweens quietly drift with real time. Pausing
 * the root holds regardless of what gets created afterwards.
 *
 * @example
 * TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
 */
export function provideGsapTesting(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      gsap.ticker.lagSmoothing(0, 0);
      elapsedMilliseconds = 0;
      // pause(0) also rewinds the clock, so every test starts from a zero
      // origin — which is what keeps advanceGsap's arithmetic exact.
      gsap.globalTimeline.pause(0);

      inject(DestroyRef).onDestroy(() => gsap.globalTimeline.resume());
    }),
  ]);
}

/**
 * Advances every running animation by `milliseconds`, synchronously and exactly.
 *
 * This seeks gsap's global timeline rather than faking the clock. Fake timers
 * cannot work here: gsap captures a direct reference to `Date.now` when its
 * module first loads, so it goes on reading real wall-clock time no matter what
 * `vi.useFakeTimers()` does to the global `Date`. Seeking sidesteps the clock
 * entirely and lands on the frame you asked for, to the floating-point digit.
 *
 * @example
 * const tween = gsap.to(box, { x: 100, duration: 1 });
 * advanceGsap(500);
 * expect(tween.progress()).toBe(0.5); // exactly 0.5, every run
 */
export function advanceGsap(milliseconds: number): void {
  if (milliseconds < 0) {
    throw new Error(`advanceGsap() cannot go backwards, got ${milliseconds}ms.`);
  }
  elapsedMilliseconds += milliseconds;
  gsap.globalTimeline.time(elapsedMilliseconds / MILLISECONDS_PER_SECOND);
}
