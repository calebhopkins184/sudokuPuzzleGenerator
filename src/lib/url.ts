/**
 * Normalizes user-typed links: trims, adds https:// when missing, and only accepts
 * http(s) URLs with a plausible host. Returns null when the input isn't a usable link.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const match = /^(https?):\/\/([^/?#:]+)(:\d+)?([/?#].*)?$/i.exec(withScheme);
  if (!match) return null;
  const host = match[2];
  if (!host.includes('.') && host.toLowerCase() !== 'localhost') return null;
  return withScheme;
}

export function hostOf(url: string): string {
  const match = /^https?:\/\/(?:www\.)?([^/?#:]+)/i.exec(url);
  return match ? match[1] : url;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
