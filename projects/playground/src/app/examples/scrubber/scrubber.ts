import type { ElementRef } from '@angular/core';
import { Component, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { animationSignals, gsapScrub, injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

const SNIPPET = `private container = viewChild.required<ElementRef>('container');
private timeline = gsap.timeline({ paused: true });

private anim = injectGSAP(() => {
  this.timeline
    .to('.box.a', { x: 200, rotate: 180 })
    .to('.box.b', { y: -40 }, '<')
    .to('.box.c', { scale: 1.6 }, '<');
}, { scope: this.container });

// drag the slider to seek the timeline; playing the timeline moves the slider back
protected progress = gsapScrub(this.timeline);

// read-only mirror of the same timeline, for the live readout below
protected playback = animationSignals(this.timeline, { killOnDestroy: false });`;

@Component({
  selector: 'app-scrubber',
  imports: [FormsModule, DecimalPipe, CodePreview, ExamplePage],
  templateUrl: './scrubber.html',
  styleUrl: './scrubber.scss',
})
export class Scrubber {
  protected readonly snippet = SNIPPET;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly timeline = gsap.timeline({ paused: true });

  private readonly anim = injectGSAP(
    () => {
      this.timeline
        .to('.box.a', { x: 200, rotate: 180 })
        .to('.box.b', { y: -40 }, '<')
        .to('.box.c', { scale: 1.6 }, '<');
    },
    { scope: this.container },
  );

  protected readonly progress = gsapScrub(this.timeline);
  protected readonly playback = animationSignals(this.timeline, { killOnDestroy: false });

  protected play(): void {
    if (this.timeline.progress() === 1) {
      this.timeline.restart();
      return;
    }
    this.timeline.play();
  }
}
