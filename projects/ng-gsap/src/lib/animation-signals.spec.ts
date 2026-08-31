import { Component, Injector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { animationSignals } from './animation-signals';

@Component({ selector: 'gsap-anim-host', template: '' })
class AnimHost {
  tween = gsap.to({}, { duration: 1, paused: true });
  playback = animationSignals(this.tween);
}

@Component({ selector: 'gsap-borrowed-host', template: '' })
class BorrowedHost {
  tween = inject(SharedTween).tween;
  playback = animationSignals(this.tween, { killOnDestroy: false });
}

class SharedTween {
  tween = gsap.to({}, { duration: 1, paused: true });
}

describe('animationSignals', () => {
  it('mirrors duration immediately and progress as the tween is scrubbed', () => {
    const fixture = TestBed.createComponent(AnimHost);
    fixture.detectChanges();
    const { progress, duration } = fixture.componentInstance.playback;

    expect(duration()).toBe(1);
    expect(progress()).toBe(0);

    fixture.componentInstance.tween.progress(0.5);
    expect(progress()).toBeCloseTo(0.5);
  });

  it('preserves an onUpdate the caller already wired up', () => {
    const existing = vi.fn();
    const tween = gsap.to({}, { duration: 1, paused: true, onUpdate: existing });

    TestBed.runInInjectionContext(() => animationSignals(tween));
    tween.progress(0.4);

    expect(existing).toHaveBeenCalled();
    tween.kill();
  });

  it('kills the animation when the host is destroyed', () => {
    const fixture = TestBed.createComponent(AnimHost);
    fixture.detectChanges();
    const tween = fixture.componentInstance.tween;

    fixture.destroy();

    expect(gsap.globalTimeline.getChildren(true, true, false).includes(tween)).toBe(false);
  });

  it('leaves the animation alone when killOnDestroy is false, and stops writing to dead signals', () => {
    TestBed.configureTestingModule({ providers: [SharedTween] });
    const fixture = TestBed.createComponent(BorrowedHost);
    fixture.detectChanges();
    const { tween, playback } = fixture.componentInstance;

    fixture.destroy();
    tween.progress(0.75);

    expect(tween.progress()).toBeCloseTo(0.75);
    expect(playback.progress()).toBe(0);
    tween.kill();
  });

  it('can be called outside an injection context with an explicit injector', () => {
    const injector: Injector = TestBed.inject(Injector);
    const tween = gsap.to({}, { duration: 1, paused: true });

    const playback = animationSignals(tween, { injector });
    tween.progress(0.25);

    expect(playback.progress()).toBeCloseTo(0.25);
    tween.kill();
  });
});
