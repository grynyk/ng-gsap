import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

const SNIPPET = `private container = viewChild.required<ElementRef>('container');
protected open = signal(false);

injectGSAP(() => {
  // \`open\` is read here, so this re-runs whenever it changes
  gsap.to('.box', {
    x: this.open() ? 220 : 0,
    rotate: this.open() ? 90 : 0,
  });
}, { scope: this.container });

// a plain signal write — no contextSafe needed, the callback re-runs itself
protected toggle(): void {
  this.open.update((v) => !v);
}`;

@Component({
  selector: 'app-basic-tween',
  imports: [CodePreview, ExamplePage],
  templateUrl: './basic-tween.html',
  styleUrl: './basic-tween.scss',
})
export class BasicTween {
  protected readonly snippet = SNIPPET;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  protected readonly open = signal(false);

  constructor() {
    injectGSAP(
      () => {
        gsap.to('.box', {
          x: this.open() ? 220 : 0,
          rotate: this.open() ? 90 : 0,
        });
      },
      { scope: this.container },
    );
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }
}
