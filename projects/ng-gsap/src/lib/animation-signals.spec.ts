import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { animationSignals } from './animation-signals';

@Component({ selector: 'anim-host', template: '' })
class AnimHost {
  tween = gsap.to({}, { duration: 1, paused: true });
  signals = animationSignals(this.tween);
}

describe('animationSignals', () => {
  it('mirrors duration immediately and progress as the tween is scrubbed', () => {
    const fixture = TestBed.createComponent(AnimHost);
    fixture.detectChanges();
    const { progress, duration } = fixture.componentInstance.signals;

    expect(duration()).toBe(1);
    expect(progress()).toBe(0);

    fixture.componentInstance.tween.progress(0.5);
    expect(progress()).toBeCloseTo(0.5);
  });

  it('kills the animation when the host is destroyed', () => {
    const fixture = TestBed.createComponent(AnimHost);
    fixture.detectChanges();
    const tween = fixture.componentInstance.tween;

    fixture.destroy();
    expect(tween.isActive()).toBe(false);
  });
});
