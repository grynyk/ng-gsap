import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { provideGsapTesting, tickGsap } from './provide-gsap-testing';

describe('provideGsapTesting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
    TestBed.inject(EnvironmentInjector); // force the ENVIRONMENT_INITIALIZER to run
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances tweens deterministically via fake timers instead of racing real time', () => {
    const tween = gsap.to({}, { duration: 1 });
    expect(tween.progress()).toBe(0);

    vi.advanceTimersByTime(500);
    tickGsap();

    expect(tween.progress()).toBeCloseTo(0.5, 1);
    tween.kill();
  });
});
