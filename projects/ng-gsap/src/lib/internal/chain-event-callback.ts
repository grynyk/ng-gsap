import type { gsap } from 'gsap';

type ChainableEvent = 'onUpdate' | 'onComplete' | 'onReverseComplete' | 'onStart';

/**
 * Adds `callback` to an animation's event without clobbering whatever the caller
 * already wired up — gsap's `eventCallback` API only stores one function per
 * event. Returns a teardown that stops the callback and, when nothing else has
 * chained on top since, restores the original.
 */
export function chainEventCallback(
  animation: gsap.core.Animation,
  type: ChainableEvent,
  callback: () => void,
): () => void {
  const previous = animation.eventCallback(type) as (() => void) | null;
  let stopped = false;

  const chained = () => {
    previous?.();
    if (!stopped) {
      callback();
    }
  };

  animation.eventCallback(type, chained);

  return () => {
    stopped = true;
    // Only unwind if we're still the outermost link, otherwise we'd drop
    // whoever chained after us.
    if (animation.eventCallback(type) === chained) {
      animation.eventCallback(type, previous);
    }
  };
}
