/** Labels automatic status reads in access logs without sending user data. */
export function systemStatusUrl(base: string, view: string) {
  const query = new URLSearchParams({ client: 'sanket-live-v2', view });
  return `${base.replace(/\/+$/, '')}/api/system/airgap?${query}`;
}
