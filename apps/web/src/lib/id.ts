/**
 * `crypto.randomUUID()` is only exposed in secure contexts (HTTPS, or the
 * `localhost` origin specifically) — accessing the dev server from another
 * device via a plain `http://<lan-ip>` origin is *not* a secure context,
 * so that method is simply undefined there and throws. `crypto.getRandomValues`
 * has no such restriction, so it's used directly here instead. This ID is
 * only ever a client-side React list key / map lookup — never a security
 * token — so cryptographic strength isn't a requirement, just collision
 * avoidance within a single browser session.
 */
export function generateClientId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}
