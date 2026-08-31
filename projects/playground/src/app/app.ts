import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly links: NavLink[] = [
    { path: '/basic-tween', label: 'Basic tween' },
    { path: '/hover', label: 'Hover directive' },
    { path: '/timeline', label: 'Timeline composition' },
    { path: '/scroll-progress', label: 'ScrollTrigger progress' },
    { path: '/scrubber', label: 'Two-way scrubber' },
    { path: '/svg-draw', label: 'SVG draw-in' },
    { path: '/list', label: 'Signal-driven list' },
  ];
}
