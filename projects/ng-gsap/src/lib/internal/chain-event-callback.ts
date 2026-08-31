import type { gsap } from 'gsap';

type ChainableEvent = 'onUpdate' | 'onComplete' | 'onReverseComplete' | 'onStart';

/**
 * Adds `callback` to an animation's event without clobbering whatever the
 * caller already wired up (gsap's `eventCallback` API only stores one fn per event).
 */
export function chainEventCallback(animation: gsap.core.Animation, type: ChainableEvent, callback: () => void): void {
  const previous = animation.eventCallback(type) as (() => void) | null;
  animation.eventCallback(type, () => {
    previous?.();
    callback();
  });
}
