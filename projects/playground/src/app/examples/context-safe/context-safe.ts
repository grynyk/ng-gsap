import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

const SNIPPET = `private stage = viewChild.required<ElementRef>('stage');

private anim = injectGSAP(() => {
  gsap.from('.chip', { scale: 0, stagger: 0.05 });
}, { scope: this.stage });

// A handler that CREATES animations lives outside the reactive callback, so
// wrap it: the tweens it makes join the same context and get reverted with
// everything else when this component is destroyed.
protected burst = this.anim.contextSafe((event: MouseEvent) => {
  gsap.to(event.target, { rotate: '+=180', y: gsap.utils.random(-20, 20) });
});

// A plain signal write needs NO wrapper — the callback re-runs and cleans up
// after itself. Wrapping this would be cargo cult.
protected shuffle = () => this.seed.update((n) => n + 1);`;

const CHIPS = ['tween', 'timeline', 'stagger', 'ease', 'scrub', 'context'];

@Component({
  selector: 'app-context-safe',
  imports: [CodePreview, ExamplePage],
  templateUrl: './context-safe.html',
  styleUrl: './context-safe.scss',
})
export class ContextSafe {
  protected readonly snippet = SNIPPET;
  protected readonly chips = CHIPS;

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  protected readonly seed = signal(0);

  private readonly anim = injectGSAP(
    () => {
      this.seed(); // re-runs the entrance whenever shuffle() bumps the seed
      gsap.from('.chip', { scale: 0, stagger: 0.05, ease: 'back.out(2)' });
    },
    { scope: this.stage },
  );

  protected readonly burst = this.anim.contextSafe((event: MouseEvent) => {
    gsap.to(event.target, {
      rotate: '+=180',
      y: gsap.utils.random(-20, 20),
      duration: 0.5,
      ease: 'back.out(2)',
    });
  });

  protected shuffle(): void {
    this.seed.update((n) => n + 1);
  }
}
