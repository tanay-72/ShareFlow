/**
 * `navigator.clipboard` is gated behind secure contexts (HTTPS, or the
 * `localhost` origin) the same way `crypto.randomUUID` is — accessing the
 * app over a plain `http://<lan-ip>` origin (e.g. from a phone on the same
 * network) leaves it undefined. `document.execCommand('copy')` is
 * deprecated but still broadly supported and has no such restriction, so
 * it's used as a fallback rather than letting the copy button silently do
 * nothing (or throw) in that situation.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  }

  document.body.removeChild(textarea);
  return succeeded;
}
