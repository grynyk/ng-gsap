import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

interface Item {
  id: number;
  label: string;
}

let nextId = 4;

const SNIPPET = `private list = viewChild.required<ElementRef>('list');
private entered = new Set<number>();

// enter: reading items() re-runs this on every add, and only rows we haven't
// animated before get a tween
private anim = injectGSAP(() => {
  this.items();
  const fresh = Array.from(this.list().nativeElement.querySelectorAll('.item'))
    .filter((el) => !this.entered.has(Number(el.dataset.id)));

  fresh.forEach((el) => this.entered.add(Number(el.dataset.id)));
  if (fresh.length) {
    gsap.from(fresh, { opacity: 0, x: -24, stagger: 0.05 });
  }
}, { scope: this.list });

// leave: this handler CREATES a tween, so it goes through contextSafe
protected remove = this.anim.contextSafe((id: number, el: HTMLElement) => {
  gsap.to(el, {
    opacity: 0,
    x: 24,
    duration: 0.25,
    onComplete: () => this.items.update((list) => list.filter((i) => i.id !== id)),
  });
});`;

@Component({
  selector: 'app-signal-driven-list',
  imports: [CodePreview, ExamplePage],
  templateUrl: './signal-driven-list.html',
  styleUrl: './signal-driven-list.scss',
})
export class SignalDrivenList {
  protected readonly snippet = SNIPPET;
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  protected readonly items = signal<Item[]>([
    { id: 1, label: 'Design the API' },
    { id: 2, label: 'Write the playground' },
    { id: 3, label: 'Ship it' },
  ]);

  // Rows already animated in. Reverting a `from` tween restores the element's
  // natural CSS, so replayed runs can't strand an old row at opacity 0.
  private readonly entered = new Set<number>();

  private readonly anim = injectGSAP(
    () => {
      this.items(); // the dependency

      const fresh = Array.from(
        this.list().nativeElement.querySelectorAll<HTMLElement>('.item'),
      ).filter((el) => !this.entered.has(Number(el.dataset['id'])));

      for (const el of fresh) {
        this.entered.add(Number(el.dataset['id']));
      }

      if (fresh.length) {
        gsap.from(fresh, { opacity: 0, x: -24, stagger: 0.05 });
      }
    },
    { scope: this.list },
  );

  protected add(): void {
    this.items.update((list) => [...list, { id: nextId++, label: `New item ${nextId - 1}` }]);
  }

  protected readonly remove = this.anim.contextSafe((id: number, target: EventTarget | null) => {
    const el = (target as HTMLElement | null)?.closest<HTMLElement>('.item');
    if (!el) {
      this.items.update((list) => list.filter((item) => item.id !== id));
      return;
    }

    this.entered.delete(id);
    gsap.to(el, {
      opacity: 0,
      x: 24,
      duration: 0.25,
      onComplete: () => this.items.update((list) => list.filter((item) => item.id !== id)),
    });
  });
}
