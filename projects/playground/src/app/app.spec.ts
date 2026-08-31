import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { NAV_SECTIONS } from './core/navigation';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders every navigation entry, grouped by section', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const expected = NAV_SECTIONS.flatMap((section) => section.items);
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('nav a');
    const headings: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.nav-section');

    expect(links.length).toBe(expected.length);
    expect(headings.length).toBe(NAV_SECTIONS.length);
  });

  it('has a route registered for every navigation entry', () => {
    const paths = new Set(routes.map((route) => `/${route.path}`));

    for (const item of NAV_SECTIONS.flatMap((section) => section.items)) {
      expect(paths.has(item.path)).toBe(true);
    }
  });
});
