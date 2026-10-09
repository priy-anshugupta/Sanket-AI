import { expect, it } from 'vitest';
import { systemStatusUrl } from '../src/lib/system-status-url';

it('labels status request source in access logs without exposing authentication data', () => {
  const url = new URL(systemStatusUrl('https://example.test/', '/dashboard'));
  expect(url.pathname).toBe('/api/system/airgap');
  expect(url.searchParams.get('client')).toBe('sanket-live-v2');
  expect(url.searchParams.get('view')).toBe('/dashboard');
  expect([...url.searchParams.keys()]).toEqual(['client', 'view']);
});
