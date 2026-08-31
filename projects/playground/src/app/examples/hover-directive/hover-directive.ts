import { Component } from '@angular/core';
import { GsapHover } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `<!-- reverses the enter tween automatically on leave -->
<div class="box" [gsapHover]="{ scale: 1.15, rotate: 8, duration: 0.25 }"></div>

<!-- or animate to an explicit leave state -->
<div
  class="box"
  [gsapHover]="{ y: -12, duration: 0.25 }"
  [gsapHoverLeave]="{ y: 0, duration: 0.6, ease: 'bounce.out' }"
></div>`;

@Component({
  selector: 'app-hover-directive-example',
  imports: [GsapHover, CodePreview],
  templateUrl: './hover-directive.html',
  styleUrl: './hover-directive.scss',
})
export class HoverDirectiveExample {
  protected readonly snippet = SNIPPET;
}
