import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { provideGsap } from './provide-gsap';

describe('provideGsap', () => {
  beforeAll(() => {
    // jsdom doesn't implement matchMedia; ScrollTrigger touches it on first registration.
    window.matchMedia ??= ((query: string) =>
      ({
        matches: false,
        media: query,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  });

  afterEach(() => {
    gsap.defaults({ duration: 0.5, ease: 'power1.out' });
  });

  it('applies configured defaults to future tweens', () => {
    TestBed.configureTestingModule({ providers: [provideGsap({ defaults: { duration: 2.5 } })] });
    TestBed.inject(EnvironmentInjector);

    const tween = gsap.to({}, {});
    expect(tween.duration()).toBe(2.5);
    tween.kill();
  });

  it('registers configured plugins without throwing', () => {
    TestBed.configureTestingModule({ providers: [provideGsap({ plugins: [ScrollTrigger] })] });
    expect(() => TestBed.inject(EnvironmentInjector)).not.toThrow();
  });
});
