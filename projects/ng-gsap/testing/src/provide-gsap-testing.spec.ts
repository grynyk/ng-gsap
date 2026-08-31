import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { advanceGsap, provideGsapTesting } from './provide-gsap-testing';

describe('provideGsapTesting', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideGsapTesting()] });
    TestBed.inject(EnvironmentInjector); // force the environment initializer to run
  });

  it('advances animations by exactly the time asked for', () => {
    const tween = gsap.to({}, { duration: 1 });
    expect(tween.progress()).toBe(0);

    advanceGsap(500);

    expect(tween.progress()).toBe(0.5);
    tween.kill();
  });

  it('accumulates across calls and completes on the frame it should', () => {
    const onComplete = vi.fn();
    const tween = gsap.to({}, { duration: 1, onComplete });

    advanceGsap(250);
    advanceGsap(250);
    expect(tween.progress()).toBe(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    advanceGsap(500);
    expect(tween.progress()).toBe(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    tween.kill();
  });

  it('advances nothing on its own — real time no longer moves animations', async () => {
    const tween = gsap.to({}, { duration: 1 });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(tween.progress()).toBe(0);
    tween.kill();
  });

  it('stays exact across many calls instead of accumulating float drift', () => {
    const tween = gsap.to({}, { duration: 10 });

    for (let i = 0; i < 20; i++) {
      advanceGsap(100);
    }

    // 20 × 100ms of a 10s tween. Accumulating `time() + delta` in seconds drifts
    // here; accumulating whole milliseconds and dividing once does not.
    expect(tween.time()).toBe(2);
    expect(tween.progress()).toBe(0.2);
    tween.kill();
  });

  it('starts every test environment from a zero clock', () => {
    expect(gsap.globalTimeline.time()).toBe(0);
  });

  it('refuses to run backwards', () => {
    expect(() => advanceGsap(-1)).toThrow(/backwards/);
  });

  it('resumes normal playback when the test environment is torn down', () => {
    expect(gsap.globalTimeline.paused()).toBe(true);

    TestBed.resetTestingModule();

    expect(gsap.globalTimeline.paused()).toBe(false);
  });
});
