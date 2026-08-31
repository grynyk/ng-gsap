import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMPLE_SECTIONS } from '../core/navigation';
import { CodePreview } from '../shared/code-preview/code-preview';

const SNIPPET = `private stage = viewChild.required<ElementRef>('stage');
protected open = signal(false);

injectGSAP(() => {
  // \`open\` is read here, so this re-runs whenever it changes
  gsap.to('.box', { x: this.open() ? 220 : 0 });
}, { scope: this.stage });

protected toggle() {
  this.open.update((v) => !v);
}`;

@Component({
  selector: 'app-home',
  imports: [RouterLink, CodePreview],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly snippet = SNIPPET;
  protected readonly sections = EXAMPLE_SECTIONS;
}
