/**
 * SANKET · AI — Universal Environment & Network Endpoint Resolver
 * Automatically resolves correct backend & WebSocket endpoints across:
 * 1. Cloud Deployments (Vercel, Render, Railway, custom domain)
 * 2. Mobile LAN / Hotspot testing (e.g. 192.168.x.x, 10.x.x.x)
 * 3. Localhost workstation development
 */

export const getApiBase = (path: string = ''): string => {
  // If explicitly configured in environment variables (Vercel / Production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local / LAN IP (Hotspot to phone, 192.168.x.x, 10.x.x.x, localhost)
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocal) {
      const base = `http://${hostname}:8000`;
      return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
    }

    // On cloud hosting like Vercel without NEXT_PUBLIC_API_URL, use relative route to leverage Next rewrites
    return path ? (path.startsWith('/') ? path : `/${path}`) : '';
  }

  return path ? `http://localhost:8000${path.startsWith('/') ? path : `/${path}`}` : 'http://localhost:8000';
};

export const getWsBase = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, '');
  }

  // Derive WebSocket URL automatically from NEXT_PUBLIC_API_URL if configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    const wsProto = process.env.NEXT_PUBLIC_API_URL.startsWith('https') ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `${wsProto}//${host}/ws/alerts`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocal) {
      return `ws://${hostname}:8000/ws/alerts`;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/alerts`;
  }

  return 'ws://localhost:8000/ws/alerts';
};
