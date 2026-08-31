import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectScrollTrigger } from './inject-scroll-trigger';

@Component({
  selector: 'st-host',
  template: `<div #trigger style="height: 200px"></div>`,
})
class StHost {
  trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  handle = injectScrollTrigger({ trigger: this.trigger, start: 'top bottom', end: 'bottom top' });
}

describe('injectScrollTrigger', () => {
  it('creates a ScrollTrigger instance targeting the resolved element and cleans up on destroy', async () => {
    const fixture = TestBed.createComponent(StHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const { instance, progress, isActive } = fixture.componentInstance.handle;
    expect(instance()).toBeTruthy();
    expect(instance()?.trigger).toBe(fixture.componentInstance.trigger().nativeElement);
    expect(typeof progress()).toBe('number');
    expect(typeof isActive()).toBe('boolean');

    fixture.destroy();
    expect(instance()).toBeUndefined();
  });
});
