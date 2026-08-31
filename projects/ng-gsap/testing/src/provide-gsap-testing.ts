import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { gsap } from 'gsap';

/**
 * Stops gsap's real-time (rAF/setTimeout) ticker loop and disables lag
 * smoothing, so tests can drive animations deterministically instead of
 * racing real time. Pair with fake timers and `tickGsap()`:
 *
 * @example
 * vi.useFakeTimers();
 * TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
 * ...
 * vi.advanceTimersByTime(500);
 * tickGsap(); // force gsap to process the elapsed time synchronously
 */
export function provideGsapTesting(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        gsap.ticker.lagSmoothing(0, 0);
        gsap.ticker.sleep();
        // Sync the ticker's internal clock to "now" so the first tickGsap()
        // call measures elapsed time from here, not from module load.
        gsap.ticker.tick();
      },
    },
  ]);
}

/** Forces gsap's ticker to process one update using real elapsed time since the last tick. */
export function tickGsap(): void {
  gsap.ticker.tick();
}
