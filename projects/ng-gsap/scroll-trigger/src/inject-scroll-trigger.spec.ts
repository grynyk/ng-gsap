import type { ElementRef } from '@angular/core';
import { Component, Injector, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMatchMediaStub, replaceMatchMedia } from '../../spec-helpers/match-media';
import { injectScrollTrigger } from './inject-scroll-trigger';

@Component({
  selector: 'gsap-st-host',
  template: `<div #trigger style="height: 200px"></div>`,
})
class StHost {
  trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  scroll = injectScrollTrigger({ trigger: this.trigger, start: 'top bottom', end: 'bottom top' });
}

describe('injectScrollTrigger', () => {
  describe('where ScrollTrigger can run', () => {
    let restore: () => void;

    beforeEach(
      () => (restore = replaceMatchMedia(window.matchMedia ?? createMatchMediaStub(false))),
    );
    afterEach(() => restore());

    it('creates a trigger on the resolved element and kills it on destroy', async () => {
      const fixture = TestBed.createComponent(StHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const { scroll, trigger } = fixture.componentInstance;
      expect(scroll.isSupported).toBe(true);
      expect(scroll.instance()).toBeTruthy();
      expect(scroll.instance()?.trigger).toBe(trigger().nativeElement);

      fixture.destroy();
      expect(scroll.instance()).toBeUndefined();
    });
  });

  describe('where it cannot (SSR, jsdom)', () => {
    let restore: () => void;

    beforeEach(() => (restore = replaceMatchMedia(undefined)));
    afterEach(() => restore());

    it('stays inert instead of throwing, so components using it are still testable', async () => {
      const fixture = TestBed.createComponent(StHost);
      expect(() => fixture.detectChanges()).not.toThrow();
      await fixture.whenStable();

      const { scroll } = fixture.componentInstance;
      expect(scroll.isSupported).toBe(false);
      expect(scroll.instance()).toBeUndefined();
      expect(scroll.progress()).toBe(0);
      expect(scroll.isActive()).toBe(false);
    });
  });

  describe('target resolution', () => {
    let restore: () => void;

    beforeEach(
      () => (restore = replaceMatchMedia(window.matchMedia ?? createMatchMediaStub(false))),
    );
    afterEach(() => restore());

    it('accepts a plain Element', () => {
      const injector: Injector = TestBed.inject(Injector);
      const element = document.createElement('div');
      document.body.appendChild(element);

      const scroll = injectScrollTrigger({ trigger: element, injector });
      TestBed.tick();

      expect(scroll.instance()?.trigger).toBe(element);
      element.remove();
    });

    it('accepts a plain ElementRef', () => {
      const injector: Injector = TestBed.inject(Injector);
      const element = document.createElement('div');
      document.body.appendChild(element);

      const scroll = injectScrollTrigger({ trigger: { nativeElement: element }, injector });
      TestBed.tick();

      expect(scroll.instance()?.trigger).toBe(element);
      element.remove();
    });

    it('still creates a trigger when the target signal has not resolved', () => {
      const injector: Injector = TestBed.inject(Injector);

      const scroll = injectScrollTrigger({ trigger: signal(undefined), injector });
      TestBed.tick();

      // No element means ScrollTrigger falls back to its own default target
      // rather than the handle failing outright.
      expect(scroll.isSupported).toBe(true);
      expect(scroll.instance()).toBeTruthy();
    });

    it('creates a trigger when no target is given at all', () => {
      const injector: Injector = TestBed.inject(Injector);

      const scroll = injectScrollTrigger({ injector });
      TestBed.tick();

      expect(scroll.instance()).toBeTruthy();
    });
  });
});
