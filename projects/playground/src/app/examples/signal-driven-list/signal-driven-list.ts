import { Component, ElementRef, signal } from '@angular/core';
import { gsap } from 'gsap';
import { GsapFrom, injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';

interface Item {
  id: number;
  label: string;
}

let nextId = 4;

const SNIPPET = `// enter: [gsapFrom] fires automatically — it's a fresh element every time
<div *ngFor="let item of items()" [gsapFrom]="{ opacity: 0, x: -24 }">{{ item.label }}</div>

// leave: Angular has no Animations module here, so animate first, then remove
remove(id: number, el: HTMLElement) {
  gsap.to(el, {
    opacity: 0,
    x: 24,
    duration: 0.25,
    onComplete: () => this.items.update((list) => list.filter((i) => i.id !== id)),
  });
}`;

@Component({
  selector: 'app-signal-driven-list',
  imports: [GsapFrom, CodePreview],
  templateUrl: './signal-driven-list.html',
  styleUrl: './signal-driven-list.scss',
})
export class SignalDrivenList {
  protected readonly snippet = SNIPPET;

  protected readonly items = signal<Item[]>([
    { id: 1, label: 'Design the API' },
    { id: 2, label: 'Write the playground' },
    { id: 3, label: 'Ship it' },
  ]);

  private readonly anim = injectGSAP(() => {});

  protected add(): void {
    this.items.update((list) => [...list, { id: nextId++, label: `New item ${nextId - 1}` }]);
  }

  protected remove(id: number, target: EventTarget | null): void {
    const el = (target as HTMLElement).closest<HTMLElement>('.item');
    if (!el) {
      this.items.update((list) => list.filter((item) => item.id !== id));
      return;
    }

    this.anim.contextSafe(() => {
      gsap.to(el, {
        opacity: 0,
        x: 24,
        duration: 0.25,
        onComplete: () => this.items.update((list) => list.filter((item) => item.id !== id)),
      });
    })();
  }
}
