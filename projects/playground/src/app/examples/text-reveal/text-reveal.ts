import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

gsap.registerPlugin(SplitText);

const SNIPPET = `private heading = viewChild.required<ElementRef>('heading');
protected replayCount = signal(0);
private split?: SplitText;

// SplitText is free now (it shipped in gsap core after the Webflow acquisition) —
// "mask: 'lines'" auto-wraps each line in overflow-hidden so words slide up cleanly
private anim = injectGSAP(() => {
  this.replayCount(); // read so replay() re-runs this
  this.split?.revert();
  this.split = SplitText.create(this.heading().nativeElement, { type: 'words, lines', mask: 'lines' });
  gsap.from(this.split.words, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.04 });
}, { scope: this.heading });

// a plain signal write — no contextSafe needed
protected replay(): void {
  this.replayCount.update((n) => n + 1);
}`;

@Component({
  selector: 'app-text-reveal',
  imports: [CodePreview, ExamplePage],
  templateUrl: './text-reveal.html',
  styleUrl: './text-reveal.scss',
})
export class TextReveal {
  protected readonly snippet = SNIPPET;
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');
  protected readonly replayCount = signal(0);
  private split?: SplitText;

  constructor() {
    injectGSAP(
      () => {
        this.replayCount();
        this.split?.revert();
        this.split = SplitText.create(this.heading().nativeElement, {
          type: 'words, lines',
          mask: 'lines',
        });
        gsap.from(this.split.words, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.04,
        });
      },
      { scope: this.heading },
    );
  }

  protected replay(): void {
    this.replayCount.update((n) => n + 1);
  }
}
