/**
 * Shared spec helper — not part of the published package.
 *
 * These specs run in two very different environments: jsdom, which has no
 * `matchMedia` at all, and a real browser, which has one reporting the actual
 * machine's settings. Neither can be assumed, so a test installs exactly the
 * `matchMedia` it needs and restores the original property descriptor
 * afterwards. A leaked stub silently changes what other specs exercise.
 */

const noop = () => undefined;

export function createMatchMediaStub(matches: boolean): typeof window.matchMedia {
  return ((media: string) => ({
    media,
    matches,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
    onchange: null,
    addListener: noop,
    removeListener: noop,
  })) as unknown as typeof window.matchMedia;
}

/**
 * Replaces `window.matchMedia` (or removes it, when passed `undefined`) and
 * returns a teardown that puts the original back.
 */
export function replaceMatchMedia(value: typeof window.matchMedia | undefined): () => void {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  if (value) {
    Object.defineProperty(window, 'matchMedia', { value, configurable: true, writable: true });
  } else {
    Reflect.deleteProperty(window, 'matchMedia');
  }

  return () => {
    Reflect.deleteProperty(window, 'matchMedia');
    if (original) {
      Object.defineProperty(window, 'matchMedia', original);
    }
  };
}

/** Convenience: install a stub reporting `matches`, and return its teardown. */
export function stubMatchMedia(matches: boolean): () => void {
  return replaceMatchMedia(createMatchMediaStub(matches));
}
