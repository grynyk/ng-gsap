import { Component, input } from '@angular/core';

@Component({
  selector: 'app-code-preview',
  template: `<pre><code>{{ code() }}</code></pre>`,
  styleUrl: './code-preview.scss',
})
export class CodePreview {
  readonly code = input.required<string>();
}
