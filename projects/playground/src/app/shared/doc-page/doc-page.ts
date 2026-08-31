import { Component, input } from '@angular/core';

/** Shared chrome for prose documentation pages. */
@Component({
  selector: 'app-doc-page',
  template: `
    <article class="prose">
      <h1>{{ title() }}</h1>
      <p class="lede">{{ lede() }}</p>
      <ng-content />
    </article>
  `,
  styleUrl: './doc-page.scss',
})
export class DocPage {
  readonly title = input.required<string>();
  readonly lede = input.required<string>();
}
