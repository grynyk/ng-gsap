import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

const SNIPPET = `private stage = viewChild.required<ElementRef>('stage');
protected stagger = signal(0.12);
protected progress = signal(0);

private timeline: gsap.core.Timeline | undefined;

// Building the timeline inside the callback means the context owns it. Reading
// stagger() makes it a dependency: move the slider and the old timeline is
// reverted and a new one built. There is no teardown code in this component.
private anim = injectGSAP(() => {
  this.timeline = gsap
    .timeline({ onUpdate: () => this.progress.set(this.timeline?.progress() ?? 0) })
    .from('.box', { opacity: 0, y: 40, stagger: this.stagger() })
    .to('.box', { rotate: 90, stagger: this.stagger() }, '>-0.2');
}, { scope: this.stage });`;

@Component({
  selector: 'app-timeline',
  imports: [CodePreview, ExamplePage],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline {
  protected readonly snippet = SNIPPET;
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly stagger = signal(0.12);
  protected readonly progress = signal(0);

  private timeline: gsap.core.Timeline | undefined;

  private readonly anim = injectGSAP(
    () => {
      this.timeline = gsap
        .timeline({ onUpdate: () => this.progress.set(this.timeline?.progress() ?? 0) })
        .from('.box', { opacity: 0, y: 40, stagger: this.stagger() })
        .to('.box', { rotate: 90, stagger: this.stagger() }, '>-0.2');
    },
    { scope: this.stage },
  );

  protected readonly boxes = [0, 1, 2, 3];

  protected replay(): void {
    this.timeline?.restart();
  }

  protected setStagger(value: string): void {
    this.stagger.set(Number(value));
  }
}
