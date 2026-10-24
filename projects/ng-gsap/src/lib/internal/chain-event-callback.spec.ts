import { gsap } from 'gsap';
import { chainEventCallback } from './chain-event-callback';

function pausedTween() {
  return gsap.to({}, { duration: 1, paused: true });
}

describe('chainEventCallback', () => {
  it('runs the caller’s existing callback as well as the new one', () => {
    const existing = vi.fn();
    const added = vi.fn();
    const tween = gsap.to({}, { duration: 1, paused: true, onUpdate: existing });

    chainEventCallback(tween, 'onUpdate', added);
    tween.progress(0.5);

    expect(existing).toHaveBeenCalled();
    expect(added).toHaveBeenCalled();
    tween.kill();
  });

  it('hands gsap’s params and callback scope to the caller’s original callback', () => {
    const scope = { owner: true };
    let seenThis: unknown;
    let seenArgs: unknown[] = [];
    const tween = gsap.to(
      {},
      {
        duration: 1,
        paused: true,
        callbackScope: scope,
        onUpdateParams: ['first', 2],
        onUpdate(this: unknown, ...args: unknown[]) {
          seenThis = this;
          seenArgs = args;
        },
      },
    );

    chainEventCallback(tween, 'onUpdate', () => undefined);
    tween.progress(0.5);

    expect(seenThis).toBe(scope);
    expect(seenArgs).toEqual(['first', 2]);
    tween.kill();
  });

  it('works when there was no existing callback', () => {
    const added = vi.fn();
    const tween = pausedTween();

    chainEventCallback(tween, 'onUpdate', added);
    tween.progress(0.5);

    expect(added).toHaveBeenCalled();
    tween.kill();
  });

  it('restores the original callback on teardown', () => {
    const existing = vi.fn();
    const added = vi.fn();
    const tween = gsap.to({}, { duration: 1, paused: true, onUpdate: existing });

    const stop = chainEventCallback(tween, 'onUpdate', added);
    stop();
    tween.progress(0.5);

    expect(tween.eventCallback('onUpdate')).toBe(existing);
    expect(existing).toHaveBeenCalled();
    expect(added).not.toHaveBeenCalled();
    tween.kill();
  });

  it('stops its own callback but leaves a later link intact', () => {
    const first = vi.fn();
    const second = vi.fn();
    const tween = pausedTween();

    const stopFirst = chainEventCallback(tween, 'onUpdate', first);
    chainEventCallback(tween, 'onUpdate', second);

    // Unwinding would drop `second`, so the chain is left in place and only
    // this link's callback goes quiet.
    stopFirst();
    tween.progress(0.5);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    tween.kill();
  });

  it('is safe to tear down more than once', () => {
    const added = vi.fn();
    const tween = pausedTween();

    const stop = chainEventCallback(tween, 'onUpdate', added);
    stop();
    stop();
    tween.progress(0.5);

    expect(added).not.toHaveBeenCalled();
    tween.kill();
  });
});
