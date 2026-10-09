export const LIVE_PATHS = new Set(['/dashboard', '/dashboard/control-room', '/dashboard/heatmap', '/dashboard/emergency', '/dashboard/graph']);
export const POLL_MS = 45_000;

// Completion-based scheduling: even a slow cold start cannot overlap requests.
export function startPolling(task: (signal: AbortSignal) => Promise<void>, options: {
  active: () => boolean;
  subscribe: (listener: () => void) => () => void;
  interval?: number;
  poll?: () => boolean;
}) {
  let disposed = false;
  let running = false;
  let wasActive = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let resumePending = false;
  let lastStarted = -Infinity;
  const interval = options.interval ?? POLL_MS;
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    clear();
    if (!disposed && options.active()) timer = setTimeout(() => {
      if (options.poll?.() !== false) void run();
      else schedule();
    }, interval);
  };
  const run = async () => {
    if (disposed || !options.active() || running) return;
    clear();
    running = true;
    lastStarted = Date.now();
    controller = new AbortController();
    try { await task(controller.signal); } catch { /* retry only after the normal interval */ }
    finally {
      running = false;
      controller = undefined;
      if (resumePending) { resumePending = false; void run(); }
      else schedule();
    }
  };
  const sync = () => {
    const active = !disposed && options.active();
    if (!active) { clear(); controller?.abort(); resumePending = false; }
    else if (!wasActive) {
      if (running) resumePending = true;
      else void run();
    }
    wasActive = active;
  };
  const unsubscribe = options.subscribe(sync);
  sync();
  return {
    refresh: () => { if (Date.now() - lastStarted >= 30_000) void run(); },
    stop: () => { disposed = true; clear(); controller?.abort(); unsubscribe(); },
  };
}

export function startSocket(url: string, receive: (event: MessageEvent) => void, options: {
  active: () => boolean;
  subscribe: (listener: () => void) => () => void;
  status: (healthy: boolean) => void;
  create?: (url: string) => WebSocket;
}) {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let delay = 30_000;
  const close = () => {
    clearTimeout(retry); clearTimeout(deadline);
    retry = undefined;
    if (socket) {
      socket.onclose = socket.onopen = socket.onerror = socket.onmessage = null;
      socket.close(); socket = undefined;
    }
    options.status(false);
  };
  const reconnect = () => {
    close();
    if (!stopped && options.active()) {
      retry = setTimeout(() => { retry = undefined; connect(); }, delay);
      delay = Math.min(60_000, delay * 2);
    }
  };
  const connect = () => {
    if (stopped || !options.active() || socket || retry) return;
    try {
      socket = (options.create ?? (url => new WebSocket(url)))(url);
      deadline = setTimeout(reconnect, 90_000);
      socket.onopen = () => { clearTimeout(deadline); delay = 30_000; options.status(true); };
      socket.onmessage = event => { if (!stopped && options.active()) receive(event); };
      socket.onerror = reconnect;
      socket.onclose = reconnect;
    } catch { reconnect(); }
  };
  const sync = () => { if (!options.active()) close(); else connect(); };
  const unsubscribe = options.subscribe(sync);
  sync();
  return () => { stopped = true; close(); unsubscribe(); };
}
