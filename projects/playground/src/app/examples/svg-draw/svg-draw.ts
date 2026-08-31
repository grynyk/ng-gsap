import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

gsap.registerPlugin(DrawSVGPlugin);

const SNIPPET = `private path = viewChild.required<ElementRef<SVGPathElement>>('path');
protected replayCount = signal(0);

// DrawSVGPlugin ships free in gsap core now — no dasharray arithmetic needed
injectGSAP(() => {
  this.replayCount(); // read so the effect re-runs on replay()
  gsap.from(this.path().nativeElement, {
    drawSVG: '0%',
    duration: 1.5,
    ease: 'power2.inOut',
  });
}, { scope: this.path });

protected replay(): void {
  this.replayCount.update((n) => n + 1);
}`;

@Component({
  selector: 'app-svg-draw',
  imports: [CodePreview, ExamplePage],
  templateUrl: './svg-draw.html',
  styleUrl: './svg-draw.scss',
})
export class SvgDraw {
  protected readonly snippet = SNIPPET;
  private readonly path = viewChild.required<ElementRef<SVGPathElement>>('path');
  protected readonly replayCount = signal(0);

  constructor() {
    injectGSAP(
      () => {
        this.replayCount();
        gsap.from(this.path().nativeElement, {
          drawSVG: '0%',
          duration: 1.5,
          ease: 'power2.inOut',
        });
      },
      { scope: this.path },
    );
  }

  protected replay(): void {
    this.replayCount.update((n) => n + 1);
  }
}
