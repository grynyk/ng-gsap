import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { injectGSAP } from './inject-gsap';

@Component({
  selector: 'test-host',
  template: `<div #box></div>`,
})
class TestHost {
  box = viewChild.required<ElementRef<HTMLElement>>('box');
  open = signal(false);
  calls = 0;

  gsapHandle = injectGSAP(
    () => {
      this.calls++;
      gsap.to(this.box().nativeElement, { x: this.open() ? 100 : 0, duration: 1 });
    },
    { scope: this.box },
  );
}

describe('injectGSAP', () => {
  it('runs the callback once after the first render', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.calls).toBe(1);
    expect(gsap.getTweensOf(fixture.componentInstance.box().nativeElement).length).toBe(1);
  });

  it('re-runs automatically when a signal read inside the callback changes — no dependency array needed', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.componentInstance.box().nativeElement;
    expect(fixture.componentInstance.calls).toBe(2);
    // the previous run's tween was reverted, so exactly one (the new) tween remains
    expect(gsap.getTweensOf(el).length).toBe(1);
  });

  it('reverts the gsap context — and everything it created — on destroy', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.componentInstance.box().nativeElement;
    fixture.destroy();

    expect(gsap.getTweensOf(el).length).toBe(0);
  });

  it('contextSafe tracks tweens created outside the reactive callback in the same context', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.componentInstance.box().nativeElement;
    const onClick = fixture.componentInstance.gsapHandle.contextSafe(() => gsap.to(el, { rotation: 90, duration: 1 }));
    onClick();

    expect(gsap.getTweensOf(el).length).toBe(2);

    fixture.destroy();
    expect(gsap.getTweensOf(el).length).toBe(0);
  });
});
