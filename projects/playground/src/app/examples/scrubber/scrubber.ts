import { Component, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { gsapScrub, injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `private container = viewChild.required<ElementRef>('container');
private timeline = gsap.timeline({ paused: true });

private anim = injectGSAP(() => {
  this.timeline
    .to('.box.a', { x: 200, rotate: 180 })
    .to('.box.b', { y: -40 }, '<')
    .to('.box.c', { scale: 1.6 }, '<');
}, { scope: this.container });

// drag the slider to seek the timeline; playing the timeline moves the slider back
protected progress = gsapScrub(this.timeline);`;

@Component({
  selector: 'app-scrubber',
  imports: [FormsModule, CodePreview],
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
}
