import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { gsapScrub } from './gsap-scrub';

@Component({ selector: 'scrub-host', template: '' })
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
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.timeline.progress()).toBeCloseTo(0.5);
  });

  it('mirrors the timeline back into the signal when it is played directly', () => {
    const fixture = TestBed.createComponent(ScrubHost);
    fixture.detectChanges();

    fixture.componentInstance.timeline.progress(0.75);

    expect(fixture.componentInstance.progress()).toBeCloseTo(0.75);
  });
});
