import type { ElementRef } from '@angular/core';
import { Component, afterRenderEffect, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

/** GSAP's own defaults, restored when Lenis stops driving the ticker. */
const LAG_THRESHOLD = 500;
const ADJUSTED_LAG = 33;

const SNIPPET = `import Lenis from 'lenis';

private scene = viewChild.required<ElementRef>('scene');
protected smooth = signal(true);

constructor() {
  // Render effects never run on the server, so Lenis is never constructed there.
  // Reading smooth() makes the toggle a dependency: off tears Lenis down, on
  // builds a fresh one.
  afterRenderEffect((onCleanup) => {
    if (!this.smooth()) {
      return;
    }

    const lenis = new Lenis(); // honours prefers-reduced-motion by default
    const stopSync = lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000); // ticker time is in seconds
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // runs when smooth() flips and again on destroy
    onCleanup(() => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // GSAP's defaults
      stopSync();
      lenis.destroy();
    });
  });

  // ordinary scrubbed ScrollTriggers — they need no changes to work with Lenis
  injectGSAP(() => {
    for (const layer of gsap.utils.toArray<HTMLElement>('.layer')) {
      gsap.to(layer, {
        yPercent: -Number(layer.dataset['depth']) * 60,
        ease: 'none',
        scrollTrigger: { trigger: layer.parentElement, scrub: true },
      });
    }
  }, { scope: this.scene });
}`;

interface Scene {
  label: string;
  caption: string;
}

const SCENES: Scene[] = [
  { label: 'Wheel', caption: 'Lenis eases the wheel delta instead of jumping by it' },
  { label: 'Ticker', caption: 'one requestAnimationFrame loop for Lenis and GSAP' },
  { label: 'Sync', caption: 'every Lenis scroll event updates ScrollTrigger' },
];

@Component({
  selector: 'app-smooth-scroll',
  imports: [CodePreview, ExamplePage],
  templateUrl: './smooth-scroll.html',
  styleUrl: './smooth-scroll.scss',
})
export class SmoothScroll {
  protected readonly snippet = SNIPPET;
  protected readonly scenes = SCENES;
  protected readonly smooth = signal(true);
  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');

  constructor() {
    afterRenderEffect((onCleanup) => {
      if (!this.smooth()) {
        return;
      }

      const lenis = new Lenis();
      const stopSync = lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      onCleanup(() => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(LAG_THRESHOLD, ADJUSTED_LAG);
        stopSync();
        lenis.destroy();
      });
    });

    injectGSAP(
      () => {
        for (const layer of gsap.utils.toArray<HTMLElement>('.layer')) {
          gsap.to(layer, {
            yPercent: -Number(layer.dataset['depth']) * 60,
            ease: 'none',
            scrollTrigger: { trigger: layer.parentElement, scrub: true },
          });
        }
      },
      { scope: this.scene },
    );
  }

  protected toggle(): void {
    this.smooth.update((v) => !v);
  }
}
