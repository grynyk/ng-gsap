import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `private path = viewChild.required<ElementRef<SVGPathElement>>('path');
protected replayCount = signal(0);

// no DrawSVGPlugin (paid) needed — stroke-dasharray/offset is the classic free-tier trick
private anim = injectGSAP(() => {
  this.replayCount(); // read so the effect re-runs on replay()
  const el = this.path().nativeElement;
  const length = el.getTotalLength();
  gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
  gsap.to(el, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' });
}, { scope: this.path });

protected replay = this.anim.contextSafe(() => this.replayCount.update((n) => n + 1));`;

@Component({
  selector: 'app-svg-draw',
  imports: [CodePreview],
  templateUrl: './svg-draw.html',
  styleUrl: './svg-draw.scss',
})
export class SvgDraw {
  protected readonly snippet = SNIPPET;
  private readonly path = viewChild.required<ElementRef<SVGPathElement>>('path');
  protected readonly replayCount = signal(0);

  private readonly anim = injectGSAP(
    () => {
      this.replayCount();
      const el = this.path().nativeElement;
      const length = el.getTotalLength();
      gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(el, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' });
    },
    { scope: this.path },
  );

  protected replay = this.anim.contextSafe(() => this.replayCount.update((n) => n + 1));
}
