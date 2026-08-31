import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { replaceMatchMedia, stubMatchMedia } from '../../spec-helpers/match-media';
import { provideGsap } from './provide-gsap';

describe('provideGsap', () => {
  afterEach(() => {
    gsap.defaults({ duration: 0.5, ease: 'power1.out' });
    gsap.globalTimeline.timeScale(1);
  });

  it('applies configured defaults to future tweens', () => {
    TestBed.configureTestingModule({ providers: [provideGsap({ defaults: { duration: 2.5 } })] });
    TestBed.inject(EnvironmentInjector);

    const tween = gsap.to({}, {});
    expect(tween.duration()).toBe(2.5);
    tween.kill();
  });

  it('registers configured plugins', () => {
    const restore = stubMatchMedia(false);
    TestBed.configureTestingModule({ providers: [provideGsap({ plugins: [ScrollTrigger] })] });

    TestBed.inject(EnvironmentInjector);

    // gsap's own registry, so this asserts real registration rather than "we called a function".
    // `globals()` is real API that its .d.ts happens not to declare.
    const registered = (gsap.core as unknown as { globals(): Record<string, unknown> }).globals();
    expect(registered['ScrollTrigger']).toBe(ScrollTrigger);
    restore();
  });

  it('leaves playback speed alone when respectReducedMotion is off', () => {
    const restore = stubMatchMedia(true);
    TestBed.configureTestingModule({ providers: [provideGsap({})] });

    TestBed.inject(EnvironmentInjector);

    expect(gsap.globalTimeline.timeScale()).toBe(1);
    restore();
  });

  it('collapses playback when reduced motion is requested, and restores it on teardown', () => {
    const restore = stubMatchMedia(true);
    TestBed.configureTestingModule({
      providers: [provideGsap({ respectReducedMotion: true })],
    });

    TestBed.inject(EnvironmentInjector);
    expect(gsap.globalTimeline.timeScale()).toBeGreaterThan(1);

    TestBed.resetTestingModule();
    expect(gsap.globalTimeline.timeScale()).toBe(1);
    restore();
  });

  it('stays at normal speed when reduced motion is not requested by the OS', () => {
    const restore = stubMatchMedia(false);
    TestBed.configureTestingModule({
      providers: [provideGsap({ respectReducedMotion: true })],
    });

    TestBed.inject(EnvironmentInjector);

    expect(gsap.globalTimeline.timeScale()).toBe(1);
    restore();
  });

  it('does nothing for reduced motion where matchMedia does not exist', () => {
    const restore = replaceMatchMedia(undefined);
    TestBed.configureTestingModule({
      providers: [provideGsap({ respectReducedMotion: true })],
    });

    // Server-side rendering and jsdom both land here; it must not throw.
    expect(() => TestBed.inject(EnvironmentInjector)).not.toThrow();
    expect(gsap.globalTimeline.timeScale()).toBe(1);
    restore();
  });

  it('follows the OS setting changing mid-session', () => {
    const listeners = new Set<() => void>();
    let matches = false;
    const stub = ((media: string) => ({
      media,
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
    const restore = replaceMatchMedia(stub);

    TestBed.configureTestingModule({
      providers: [provideGsap({ respectReducedMotion: true })],
    });
    TestBed.inject(EnvironmentInjector);
    expect(gsap.globalTimeline.timeScale()).toBe(1);

    matches = true;
    listeners.forEach((listener) => listener());
    expect(gsap.globalTimeline.timeScale()).toBeGreaterThan(1);

    matches = false;
    listeners.forEach((listener) => listener());
    expect(gsap.globalTimeline.timeScale()).toBe(1);

    restore();
  });
});
