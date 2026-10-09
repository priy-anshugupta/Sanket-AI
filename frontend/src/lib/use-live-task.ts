'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LIVE_PATHS, startPolling } from './live-lifecycle';

export function hasSession() {
  const token = localStorage.getItem('sanket_token');
  if (!token || token.startsWith('mock')) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch { return false; }
}
export function browserActivity(listener: () => void) {
  let leaving = false;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  const changed = () => {
    clearTimeout(expiry);
    try {
      const token = localStorage.getItem('sanket_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const remaining = payload.exp * 1000 - Date.now();
        if (remaining > 0) expiry = setTimeout(changed, Math.min(remaining, 2_147_483_647));
      }
    } catch {}
    listener();
  };
  const hide = () => { leaving = true; changed(); };
  const show = () => { leaving = false; changed(); };
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  for (const event of ['storage', 'sanket:auth']) window.addEventListener(event, changed);
  document.addEventListener('visibilitychange', changed);
  activityLeaving.set(listener, () => leaving);
  changed();
  return () => {
    clearTimeout(expiry);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', show);
    for (const event of ['storage', 'sanket:auth']) window.removeEventListener(event, changed);
    document.removeEventListener('visibilitychange', changed);
    activityLeaving.delete(listener);
  };
}

const activityLeaving = new Map<() => void, () => boolean>();
export function activityOptions(enabled: boolean) {
  let listener: (() => void) | undefined;
  return {
    active: () => enabled && hasSession() && document.visibilityState === 'visible' && !(listener && activityLeaving.get(listener)?.()),
    subscribe: (callback: () => void) => { listener = callback; return browserActivity(callback); },
  };
}

// snapshot tasks include aggregates/status changes not supplied by the alert socket.
export function useLiveTask(task: (signal: AbortSignal) => Promise<void>, dependencies: unknown[] = [], options: { once?: boolean; enabled?: boolean; events?: boolean; poll?: () => boolean } = {}) {
  const pathname = usePathname();
  const latest = useRef(task);
  useEffect(() => { latest.current = task; });
  const enabled = options.enabled ?? LIVE_PATHS.has(pathname);
  useEffect(() => {
    let completed = false;
    const controller = startPolling(async signal => {
      if (options.once && completed) return;
      await latest.current(signal);
      if (!signal.aborted) completed = true;
    }, { ...activityOptions(enabled), poll: () => !options.once && (options.poll?.() ?? true) });
    const refresh = () => controller.refresh();
    if (options.events) window.addEventListener('sanket:new_report', refresh);
    return () => {
      controller.stop();
      window.removeEventListener('sanket:new_report', refresh);
    };
    // The caller lists query inputs explicitly; callback changes alone must not restart traffic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, enabled, options.once, options.events, ...dependencies]);
}
