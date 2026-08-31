import { Component, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { gsapScrub } from './gsap-scrub';

@Component({ selector: 'gsap-scrub-host', template: '' })
class ScrubHost {
  timeline = gsap.timeline({ paused: true }).to({}, { duration: 2 });
  progress = gsapScrub(this.timeline);
}

describe('gsapScrub', () => {
  it('seeks the timeline when the signal is written', async () => {
    const fixture = TestBed.createComponent(ScrubHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.progress.set(0.5);
    await fixture.whenStable();

    expect(fixture.componentInstance.timeline.progress()).toBeCloseTo(0.5);
  });

  it('mirrors the timeline back into the signal when it is seeked directly', () => {
    const fixture = TestBed.createComponent(ScrubHost);
    fixture.detectChanges();

    fixture.componentInstance.timeline.progress(0.75);

    expect(fixture.componentInstance.progress()).toBeCloseTo(0.75);
  });

  it('settles instead of ping-ponging between the two directions', async () => {
    const fixture = TestBed.createComponent(ScrubHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const { timeline, progress } = fixture.componentInstance;
    const seek = vi.spyOn(timeline, 'progress');

    // A write the timeline then echoes back must not trigger a second seek —
    // that feedback loop is what the EPSILON comparison exists to stop.
    progress.set(0.25);
    await fixture.whenStable();
    const seeksAfterFirstWrite = seek.mock.calls.filter((args) => args.length > 0).length;

    await fixture.whenStable();
    const seeksAfterSettling = seek.mock.calls.filter((args) => args.length > 0).length;

    expect(seeksAfterFirstWrite).toBe(1);
    expect(seeksAfterSettling).toBe(1);
    expect(progress()).toBeCloseTo(0.25);
    seek.mockRestore();
  });

  it('kills the timeline on destroy', () => {
    const fixture = TestBed.createComponent(ScrubHost);
    fixture.detectChanges();
    const timeline = fixture.componentInstance.timeline;

    fixture.destroy();

    expect(gsap.globalTimeline.getChildren(true, true, true).includes(timeline)).toBe(false);
  });

  it('leaves the timeline alone when killOnDestroy is false', () => {
    const injector: Injector = TestBed.inject(Injector);
    const timeline = gsap.timeline({ paused: true }).to({}, { duration: 1 });

    TestBed.runInInjectionContext(() => gsapScrub(timeline, { injector, killOnDestroy: false }));
    TestBed.resetTestingModule();

    timeline.progress(0.5);
    expect(timeline.progress()).toBeCloseTo(0.5);
    timeline.kill();
  });
});
