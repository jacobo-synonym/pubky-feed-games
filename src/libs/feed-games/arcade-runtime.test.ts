import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

const windowListeners: [string, EventListenerOrEventListenerObject][] = [];
const documentListeners: [string, EventListenerOrEventListenerObject][] = [];
afterEach(() => {
  for (const [type, listener] of windowListeners.splice(0)) window.removeEventListener(type, listener);
  for (const [type, listener] of documentListeners.splice(0)) document.removeEventListener(type, listener);
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function player(kind: 'memory' | 'reaction') {
  vi.useFakeTimers();
  document.body.innerHTML = readFileSync('public/games/runtime/2.0.0/arcade.html', 'utf8');
  const post = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  const addWindowListener = window.addEventListener.bind(window);
  const addDocumentListener = document.addEventListener.bind(document);
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
    windowListeners.push([type, listener]);
    addWindowListener(type, listener);
  });
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener) => {
    documentListeners.push([type, listener]);
    addDocumentListener(type, listener);
  });
  const context = {
    window,
    document,
    parent: window,
    performance,
    setTimeout,
    clearTimeout,
    ArcadeEngine: {} as { deck: (seed: number, difficulty: number) => number[] },
  };
  runInNewContext(readFileSync('public/games/runtime/2.0.0/arcade-engine.js', 'utf8'), context);
  runInNewContext(readFileSync('public/games/runtime/2.0.0/arcade.js', 'utf8'), context);
  window.dispatchEvent(
    new MessageEvent('message', {
      source: window,
      origin: 'https://parent.example',
      data: {
        v: 1,
        type: 'init',
        channel: '12345678-1234-1234-1234-123456789012',
        config: { kind, seed: 719, difficulty: 1, theme: 'park' },
      },
    }),
  );
  const click = (id: string) => window.document.getElementById(id)?.click();
  click('start');
  return { window, post, click, engine: context.ArcadeEngine };
}
describe('Sandboxed arcade sessions', () => {
  it('completes a memory board, sends one result, and restarts cleanly', () => {
    const { window, post, engine } = player('memory');
    const cards: number[] = engine.deck(719, 1);
    const reveal = (index: number) =>
      window.document.querySelectorAll<HTMLButtonElement>('#board button')[index].click();
    for (const symbol of new Set(cards))
      cards.forEach((card, index) => {
        if (card === symbol) reveal(index);
      });
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'result', result: { score: 400 } }),
      'https://parent.example',
    );
    window.dispatchEvent(
      new window.MessageEvent('message', {
        source: window,
        origin: 'https://parent.example',
        data: { v: 1, type: 'restart', channel: '12345678-1234-1234-1234-123456789012' },
      }),
    );
    expect(window.document.getElementById('progress')?.textContent).toBe('0 / 4 pairs');
  });
  it('pauses reaction rounds and scores early taps as zero', () => {
    const { window, post, click } = player('reaction');
    click('pause');
    vi.advanceTimersByTime(10000);
    expect(window.document.getElementById('paused')?.hidden).toBe(false);
    expect(window.document.getElementById('progress')?.textContent).toBe('Round 1 / 5');
    click('resume');
    for (let i = 0; i < 5; i++) {
      click('signal');
      vi.advanceTimersByTime(850);
    }
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'result', result: { score: 0 } }),
      'https://parent.example',
    );
  });
});
