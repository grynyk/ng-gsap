import { Component, computed, input } from '@angular/core';

const REPO = 'https://github.com/grynyk/ng-gsap/blob/main/projects/playground/src/app';

/**
 * Shared chrome for every example page: heading, intro prose, the live demo,
 * and a link to the component's real source. Keeps the pages consistent and
 * means an example only has to supply what makes it different.
 */
@Component({
  selector: 'app-example-page',
  template: `
    <header class="example-header">
      <div>
        <h1>{{ title() }}</h1>
        <p class="entry-point">
          <code>{{ entryPoint() }}</code>
        </p>
      </div>
      <a class="source-link" [href]="sourceUrl()" target="_blank" rel="noopener">
        View source
        <span aria-hidden="true">↗</span>
      </a>
    </header>

    <ng-content />
  `,
  styleUrl: './example-page.scss',
})
export class ExamplePage {
  readonly title = input.required<string>();
  /** Folder name under `examples/`, used to link at the real file on GitHub. */
  readonly source = input.required<string>();
  /** Which import path this example is demonstrating. */
  readonly entryPoint = input<string>('ng-gsap');

  protected readonly sourceUrl = computed(
    () => `${REPO}/examples/${this.source()}/${this.source()}.ts`,
  );
}
