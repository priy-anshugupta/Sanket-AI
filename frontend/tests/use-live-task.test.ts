import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useLiveTask, activityOptions } from '../src/lib/use-live-task';
import { startSocket } from '../src/lib/live-lifecycle';
import { useState } from 'react';
let pathname = '/dashboard';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
const token = () => `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.signature`;
beforeEach(() => {
  vi.useFakeTimers();
  pathname = '/dashboard';
  localStorage.setItem('sanket_token', token());
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});
afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); });
it('does not restart status polling on five-second rerenders or updates from its own response', async () => {
  const fetchStatus = vi.fn(async () => ({}));
  const hook = renderHook(({ tick }) => {
    const [, setStatus] = useState({});
    useLiveTask(async signal => {
      const response = await fetchStatus();
      if (!signal.aborted) setStatus(response);
      void tick;
    });
  }, { initialProps: { tick: 0 } });
  for (let tick = 1; tick <= 8; tick++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    hook.rerender({ tick });
    expect(fetchStatus).toHaveBeenCalledTimes(1);
  }
  await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
  expect(fetchStatus).toHaveBeenCalledTimes(2);
  await act(async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  for (let tick = 9; tick <= 20; tick++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    hook.rerender({ tick });
  }
  expect(fetchStatus).toHaveBeenCalledTimes(2);
});

it('never starts automatic dashboard status reads on static and historical routes', async () => {
  const task = vi.fn(async () => {});
  for (const route of ['/', '/login', '/dashboard/replay', '/dashboard/report/123', '/dashboard/voice', '/dashboard/settings', '/worker']) {
    pathname = route;
    const page = renderHook(() => useLiveTask(task));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    page.unmount();
  }
  expect(task).not.toHaveBeenCalled();
});
it('gates actual hooks by auth, route, visibility, logout, and navigation', async () => {
  localStorage.clear();
  const task = vi.fn(async () => {});
  const hook = renderHook(() => useLiveTask(task));
  expect(task).not.toHaveBeenCalled();
  await act(async () => {
    localStorage.setItem('sanket_token', token());
    window.dispatchEvent(new Event('sanket:auth'));
  });
  expect(task).toHaveBeenCalledTimes(1);
  await act(async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(300_000);
  });
  expect(task).toHaveBeenCalledTimes(1);
  await act(async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(task).toHaveBeenCalledTimes(2);
  pathname = '/dashboard/replay';
  hook.rerender();
  await act(async () => { await vi.advanceTimersByTimeAsync(300_000); });
  expect(task).toHaveBeenCalledTimes(2);
  pathname = '/dashboard'; hook.rerender();
  await act(async () => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: 'sanket_token' }));
    await vi.advanceTimersByTimeAsync(300_000);
  });
  expect(task).toHaveBeenCalledTimes(3);
});
it('aborts outstanding work on query changes and unmount', async () => {
  const signals: AbortSignal[] = [];
  const task = vi.fn(async (signal: AbortSignal) => { signals.push(signal); await new Promise(() => {}); });
  const hook = renderHook(({ query }) => useLiveTask(task, [query]), { initialProps: { query: 'first' } });
  hook.rerender({ query: 'second' });
  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
  hook.unmount();
  expect(signals[1].aborted).toBe(true);
});
it('once-only history does not poll or refresh on return', async () => {
  pathname = '/worker';
  const task = vi.fn(async () => {});
  renderHook(() => useLiveTask(task, [], { once: true, enabled: true }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300_000);
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('pageshow'));
  });
  expect(task).toHaveBeenCalledTimes(1);
});
it('pagehide closes connections even while visibility remains visible, and BFCache return reopens them', async () => {
  const close = vi.fn();
  const create = vi.fn(() => ({ close } as unknown as WebSocket));
  const stop = startSocket('wss://example.test', vi.fn(), { ...activityOptions(true), create, status: vi.fn() });
  window.dispatchEvent(new Event('pagehide'));
  expect(close).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(300_000);
  expect(create).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('pageshow'));
  expect(create).toHaveBeenCalledTimes(2);
  stop();
});
it('expired and demo sessions never start updates; expiry closes an existing connection', async () => {
  localStorage.setItem('sanket_token', 'mock-jwt-token-demo');
  const task = vi.fn(async () => {});
  renderHook(() => useLiveTask(task));
  expect(task).not.toHaveBeenCalled();
  cleanup();
  localStorage.setItem('sanket_token', `h.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 1 }))}.s`);
  const close = vi.fn();
  const stop = startSocket('wss://example.test', vi.fn(), {
    ...activityOptions(true), create: () => ({ close } as unknown as WebSocket), status: vi.fn(),
  });
  await vi.advanceTimersByTimeAsync(1_001);
  expect(close).toHaveBeenCalledTimes(1);
  stop();
});
