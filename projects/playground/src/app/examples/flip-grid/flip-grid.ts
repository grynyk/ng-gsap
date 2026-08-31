import type { ElementRef } from '@angular/core';
import { Component, signal, viewChild, viewChildren } from '@angular/core';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { injectGSAP } from 'ng-gsap';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { ExamplePage } from '../../shared/example-page/example-page';

gsap.registerPlugin(Flip);

interface Tile {
  id: number;
  label: string;
  hue: number;
}

const TILES: Tile[] = [
  { id: 1, label: 'Tween', hue: 84 },
  { id: 2, label: 'Timeline', hue: 200 },
  { id: 3, label: 'Ease', hue: 280 },
  { id: 4, label: 'Stagger', hue: 20 },
  { id: 5, label: 'Scrub', hue: 340 },
  { id: 6, label: 'Pin', hue: 160 },
  { id: 7, label: 'Morph', hue: 40 },
  { id: 8, label: 'Flip', hue: 260 },
  { id: 9, label: 'Context', hue: 110 },
];

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const SNIPPET = `protected items = signal<Tile[]>(TILES);
protected large = signal(false);
private flipState?: Flip.FlipState;

// viewChildren, not a '.tile' selector string — Angular already tracks every
// rendered tile, so Flip gets the real elements straight from the query
private tiles = viewChildren<ElementRef<HTMLElement>>('tile');

// items()/large() are the dependencies — injectGSAP re-runs after Angular's
// @for reorders the DOM, and Flip.from() animates from the captured "before" state
private anim = injectGSAP(() => {
  this.items();
  this.large();
  if (this.flipState) {
    Flip.from(this.flipState, { duration: 0.6, ease: 'power2.inOut', stagger: 0.03, scale: true });
    this.flipState = undefined;
  }
}, { scope: this.grid });

protected shuffle(): void {
  this.flipState = Flip.getState(this.tiles().map((t) => t.nativeElement)); // capture "before"
  this.items.update((list) => shuffle(list)); // Angular reorders the DOM
}`;

@Component({
  selector: 'app-flip-grid',
  imports: [CodePreview, ExamplePage],
  templateUrl: './flip-grid.html',
  styleUrl: './flip-grid.scss',
})
export class FlipGrid {
  protected readonly snippet = SNIPPET;
  private readonly grid = viewChild.required<ElementRef<HTMLElement>>('grid');

  protected readonly items = signal<Tile[]>(TILES);
  protected readonly large = signal(false);
  private readonly tiles = viewChildren<ElementRef<HTMLElement>>('tile');
  private flipState?: Flip.FlipState;

  private readonly anim = injectGSAP(
    () => {
      this.items();
      this.large();
      if (this.flipState) {
        Flip.from(this.flipState, {
          duration: 0.6,
          ease: 'power2.inOut',
          stagger: 0.03,
          scale: true,
        });
        this.flipState = undefined;
      }
    },
    { scope: this.grid },
  );

  private captureFlipState(): void {
    this.flipState = Flip.getState(this.tiles().map((tile) => tile.nativeElement));
  }

  protected shuffle(): void {
    this.captureFlipState();
    this.items.update((list) => shuffle(list));
  }

  protected sortAlpha(): void {
    this.captureFlipState();
    this.items.update((list) => [...list].sort((a, b) => a.label.localeCompare(b.label)));
  }

  protected toggleSize(): void {
    this.captureFlipState();
    this.large.update((v) => !v);
  }
}
