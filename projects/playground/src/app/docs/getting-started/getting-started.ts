import { Component } from '@angular/core';
import { CodePreview } from '../../shared/code-preview/code-preview';
import { DocPage } from '../../shared/doc-page/doc-page';

const INSTALL = `ng add ng-gsap`;

const INSTALL_MANUAL = `npm install ng-gsap gsap`;

const PROVIDE = `import { provideGsap } from 'ng-gsap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGsap({
      defaults: { ease: 'power2.out', duration: 0.6 },
      respectReducedMotion: true,
    }),
  ],
};`;

const FIRST = `import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { gsap } from 'gsap';
import { injectGSAP } from 'ng-gsap';

@Component({
  selector: 'app-box',
  template: \`<div #stage><div class="box"></div></div>\`,
})
export class Box {
  private stage = viewChild.required<ElementRef>('stage');
  protected open = signal(false);

  constructor() {
    injectGSAP(() => {
      // \`open\` is read here, so this re-runs whenever it changes
      gsap.to('.box', { x: this.open() ? 220 : 0 });
    }, { scope: this.stage });
  }

  protected toggle() {
    this.open.update((v) => !v);
  }
}`;

@Component({
  selector: 'app-getting-started',
  imports: [DocPage, CodePreview],
  templateUrl: './getting-started.html',
})
export class GettingStarted {
  protected readonly install = INSTALL;
  protected readonly installManual = INSTALL_MANUAL;
  protected readonly provide = PROVIDE;
  protected readonly first = FIRST;
}
