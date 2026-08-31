import type { ElementRef } from '@angular/core';
import { Component, computed, viewChild } from '@angular/core';
import { injectScrollTrigger } from 'ng-gsap/scroll-trigger';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

interface Chapter {
  title: string;
  body: string;
}

const CHAPTERS: Chapter[] = [
  {
    title: 'Scroll down',
    body: "This panel pins in place while you scroll through it — the page keeps moving, the panel doesn't.",
  },
  {
    title: 'Signals drive it',
    body: 'progress() from injectScrollTrigger picks the active chapter and its crossfade — no separate timeline to keep in sync.',
  },
  {
    title: 'Keep scrolling',
    body: 'ScrollTrigger owns the pin and the scrub math; ng-gsap just mirrors its state as plain signals.',
  },
  {
    title: "You're through",
    body: 'The section unpins here and the page continues normally underneath.',
  },
];

/**
 * Fraction of the scroll held at each end so the first and last chapters get a
 * moment on screen. Without it they peak only at progress 0 and 1 exactly —
 * which is to say, never.
 */
const HOLD = 0.12;

const SNIPPET = `private story = viewChild.required<ElementRef>('story');

// pin, start, end — the full ScrollTrigger.StaticVars surface, not a bespoke
// pin API. injectScrollTrigger just mirrors whatever comes back as signals.
protected scroll = injectScrollTrigger({
  trigger: this.story,
  start: 'top top+=48',   // pin just below the viewport edge, not flush to it
  end: '+=200%',          // ~2 viewport heights of pinned scrolling
  pin: true,
});

// Progress is squeezed into the middle of the scroll so the first and last
// chapters hold at full opacity instead of peaking for a single frame.
private position = computed(() => {
  const eased = (this.scroll.progress() - HOLD) / (1 - HOLD * 2);
  return Math.min(1, Math.max(0, eased)) * (CHAPTERS.length - 1);
});

// each chapter's opacity is a plain function of that — the neighbouring pair
// crossfades and always sums to 1, so they never double-expose
protected opacityFor(index: number): number {
  return Math.max(0, 1 - Math.abs(this.position() - index));
}`;

@Component({
  selector: 'app-scroll-pin',
  imports: [CodePreview, ExamplePage],
  templateUrl: './scroll-pin.html',
  styleUrl: './scroll-pin.scss',
})
export class ScrollPin {
  protected readonly snippet = SNIPPET;
  protected readonly chapters = CHAPTERS;
  private readonly story = viewChild.required<ElementRef<HTMLElement>>('story');

  protected readonly scroll = injectScrollTrigger({
    trigger: this.story,
    start: 'top top+=48',
    end: '+=200%',
    pin: true,
  });

  /**
   * Raw progress remapped onto the chapter indices, with a hold at each end.
   * 0 → first chapter, CHAPTERS.length - 1 → last.
   */
  private readonly position = computed(() => {
    const eased = (this.scroll.progress() - HOLD) / (1 - HOLD * 2);
    return Math.min(1, Math.max(0, eased)) * (this.chapters.length - 1);
  });

  protected readonly activeIndex = computed(() => Math.round(this.position()));

  protected opacityFor(index: number): number {
    return Math.max(0, 1 - Math.abs(this.position() - index));
  }
}
