import { InjectionToken } from '@angular/core';
import type { gsap } from 'gsap';

export interface GsapConfig {
  /** Plugins to register once, app-wide (e.g. ScrollTrigger, Draggable). */
  plugins?: object[];
  /** Applied via `gsap.defaults()` so every tween/timeline inherits them. */
  defaults?: gsap.TweenVars;
}

export const GSAP_CONFIG = new InjectionToken<GsapConfig>('ng-gsap.config');

/**
 * Provided by the `gsapTimeline` directive so descendant `gsapTo` / `gsapFrom` /
 * `gsapFromTo` directives can discover and add themselves to it via DI instead of
 * requiring a manual timeline reference to be wired through the component tree.
 */
export const GSAP_TIMELINE = new InjectionToken<gsap.core.Timeline>('ng-gsap.timeline');
