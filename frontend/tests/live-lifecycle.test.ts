import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startPolling, startSocket, LIVE_PATHS } from '../src/lib/live-lifecycle';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
function activity() {
  let active = true;
  let listener = () => {};
  return {
    active: () => active,
    subscribe: (fn: () => void) => { listener = fn; return vi.fn(); },
    set: (value: boolean) => { active = value; listener(); },
  };
}

describe('poll lifecycle', () => {
  it('starts immediately, polls at 45 seconds, and stops permanently on cleanup', async () => {
    const task = vi.fn(async () => {});
    const a = activity();
    const poll = startPolling(task, a);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(44_999);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(2);
    poll.stop();
    await vi.advanceTimersByTimeAsync(300_000);
    expect(task).toHaveBeenCalledTimes(2);
  });
  it('aborts hidden requests, rejects stale writes, and resumes without overlap', async () => {
    const a = activity();
    const writes: string[] = [];
    let resolve!: () => void;
    let signal!: AbortSignal;
    const task = vi.fn(async (s: AbortSignal) => {
      signal = s;
      await new Promise<void>(r => { resolve = r; });
      if (!s.aborted) writes.push('current');
    });
    const poll = startPolling(task, a);
    a.set(false);
    expect(signal.aborted).toBe(true);
    a.set(true);
    expect(task).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes).toEqual([]);
    expect(task).toHaveBeenCalledTimes(2);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes).toEqual(['current']);
    poll.stop();
  });
  it('never overlaps a cold start or makes rapid event-triggered retries', async () => {
    const a = activity();
    let resolve!: () => void;
    const task = vi.fn(() => new Promise<void>(r => { resolve = r; }));
    const poll = startPolling(task, a);
    await vi.advanceTimersByTimeAsync(180_000);
    poll.refresh();
    expect(task).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(44_999);
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(2);
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    for (let i = 0; i < 100; i++) poll.refresh();
    expect(task).toHaveBeenCalledTimes(2);
    poll.stop();
  });
  it('suspends duplicate fallback polling while the socket is healthy', async () => {
    let healthy = true;
    const task = vi.fn(async () => {});
    const poll = startPolling(task, { ...activity(), poll: () => !healthy });
    await vi.advanceTimersByTimeAsync(180_000);
    expect(task).toHaveBeenCalledTimes(1);
    healthy = false;
    await vi.advanceTimersByTimeAsync(45_000);
    expect(task).toHaveBeenCalledTimes(2);
    poll.stop();
  });
  it('waits 45 seconds after errors rather than rapidly retrying', async () => {
    const task = vi.fn(async () => { throw new Error('cold start'); });
    const poll = startPolling(task, activity());
    await vi.advanceTimersByTimeAsync(29_999);
    poll.refresh();
    expect(task).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_001);
    expect(task).toHaveBeenCalledTimes(2);
    poll.stop();
  });
});

describe('socket lifecycle', () => {
  function setup() {
    const sockets: WebSocket[] = [];
    const create = vi.fn(() => {
      const ws = { close: vi.fn(), onopen: null, onclose: null, onerror: null, onmessage: null } as unknown as WebSocket;
      sockets.push(ws); return ws;
    });
    const a = activity();
    const status = vi.fn();
    const receive = vi.fn();
    const stop = startSocket('wss://example.test', receive, { ...a, create, status });
    return { a, sockets, create, stop, status, receive };
  }
  it('closes hidden sockets and resumes immediately; late events cannot reconnect after disposal', async () => {
    const x = setup();
    const oldClose = x.sockets[0].onclose!;
    x.a.set(false);
    expect(x.sockets[0].close).toHaveBeenCalled();
    expect(x.sockets[0].onclose).toBeNull();
    await vi.advanceTimersByTimeAsync(180_000);
    expect(x.create).toHaveBeenCalledTimes(1);
    x.a.set(true);
    expect(x.create).toHaveBeenCalledTimes(2);
    x.stop();
    oldClose.call(x.sockets[0], new CloseEvent('close'));
    await vi.advanceTimersByTimeAsync(180_000);
    expect(x.create).toHaveBeenCalledTimes(2);
  });
  it('backs off reconnects at 30 then 60 seconds and cancels retries on logout', async () => {
    const x = setup();
    x.sockets[0].onclose!.call(x.sockets[0], new CloseEvent('close'));
    await vi.advanceTimersByTimeAsync(29_999);
    expect(x.create).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(x.create).toHaveBeenCalledTimes(2);
    x.sockets[1].onerror!.call(x.sockets[1], new Event('error'));
    await vi.advanceTimersByTimeAsync(59_999);
    expect(x.create).toHaveBeenCalledTimes(2);
    x.a.set(false);
    await vi.advanceTimersByTimeAsync(180_000);
    expect(x.create).toHaveBeenCalledTimes(2);
    x.stop();
  });
  it('only recognizes the five live dashboards', () => {
    for (const path of ['/', '/login', '/worker', '/dashboard/replay', '/dashboard/report/123', '/dashboard/settings', '/dashboard/voice']) expect(LIVE_PATHS.has(path)).toBe(false);
    expect(LIVE_PATHS.size).toBe(5);
  });
});
