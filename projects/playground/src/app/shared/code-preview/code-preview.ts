import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-code-preview',
  template: `
    <figure>
      @if (title()) {
        <figcaption>{{ title() }}</figcaption>
      }
      <button
        type="button"
        class="copy"
        [class.copied]="copied()"
        (click)="copy()"
        [attr.aria-label]="copied() ? 'Copied to clipboard' : 'Copy code to clipboard'"
      >
        {{ copied() ? 'Copied' : 'Copy' }}
      </button>
      <pre><code>{{ code() }}</code></pre>
    </figure>
  `,
  styleUrl: './code-preview.scss',
})
export class CodePreview {
  readonly code = input.required<string>();
  readonly title = input<string>('');

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      // Clipboard is unavailable over plain http or without permission; the
      // code is selectable either way, so there is nothing useful to report.
    }
  }
}
