import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodePreview } from '../shared/code-preview/code-preview';

const SNIPPET = `private container = viewChild.required<ElementRef>('container');
private open = signal(false);

private anim = injectGSAP(() => {
  gsap.to('.box', { x: this.open() ? 200 : 0 });
  // reading open() here IS the dependency — no array to maintain
}, { scope: this.container });

onClick = this.anim.contextSafe(() => this.open.update(v => !v));`;

@Component({
  selector: 'app-home',
  imports: [RouterLink, CodePreview],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly snippet = SNIPPET;
}
