import { Component, viewChild } from '@angular/core';
import { GsapFrom, GsapTimeline } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

const SNIPPET = `<!-- children discover the parent timeline via inject(), no manual wiring -->
<div gsapTimeline>
  <div class="box" [gsapFrom]="{ opacity: 0, y: 40 }" gsapPosition="0"></div>
  <div class="box" [gsapFrom]="{ opacity: 0, y: 40 }" gsapPosition="<0.1"></div>
  <div class="box" [gsapFrom]="{ opacity: 0, y: 40 }" gsapPosition="<0.1"></div>
</div>`;

@Component({
  selector: 'app-timeline-composition',
  imports: [GsapTimeline, GsapFrom, CodePreview],
  templateUrl: './timeline-composition.html',
  styleUrl: './timeline-composition.scss',
})
export class TimelineComposition {
  protected readonly snippet = SNIPPET;
  private readonly timelineDirective = viewChild.required(GsapTimeline);

  protected replay(): void {
    this.timelineDirective().timeline.restart();
  }
}
