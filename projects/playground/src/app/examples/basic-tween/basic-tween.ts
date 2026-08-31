import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `private container = viewChild.required<ElementRef>('container');
private open = signal(false);

private anim = injectGSAP(() => {
  gsap.to('.box', {
    x: this.open() ? 220 : 0,
    rotate: this.open() ? 90 : 0,
  }); // reading open() here IS the dependency
}, { scope: this.container });

toggle = this.anim.contextSafe(() => this.open.update((v) => !v));`;

@Component({
  selector: 'app-basic-tween',
  imports: [CodePreview],
  templateUrl: './basic-tween.html',
  styleUrl: './basic-tween.scss',
})
export class BasicTween {
  protected readonly snippet = SNIPPET;
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  protected readonly open = signal(false);

  private readonly anim = injectGSAP(
    () => {
      gsap.to('.box', {
        x: this.open() ? 220 : 0,
        rotate: this.open() ? 90 : 0,
      });
    },
    { scope: this.container },
  );

  protected toggle = this.anim.contextSafe(() => this.open.update((v) => !v));
}
