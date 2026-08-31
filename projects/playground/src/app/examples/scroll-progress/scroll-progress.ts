import { Component, ElementRef, viewChild } from '@angular/core';
import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `private section = viewChild.required<ElementRef>('section');

protected scrollTrigger = injectScrollTrigger({
  trigger: this.section,
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
});
// scrollTrigger.progress() / .isActive() are plain signals — no subscription to tear down`;

@Component({
  selector: 'app-scroll-progress',
  imports: [CodePreview],
  templateUrl: './scroll-progress.html',
  styleUrl: './scroll-progress.scss',
})
export class ScrollProgress {
  protected readonly snippet = SNIPPET;
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');

  protected readonly scrollTrigger = injectScrollTrigger({
    trigger: this.section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
  });
}
