/**
 * YouTube search goes through Mat Review's own server so the YouTube Data API key
 * never ships in the app bundle. EXPO_PUBLIC_MAT_REVIEW_API_URL is only the proxy's
 * base URL (not a secret). Never put API keys in EXPO_PUBLIC_* variables.
 *
 * Contract: GET {base}/youtube/search?q=<query>
 *   -> { items: [{ videoId, title, channelTitle, thumbnailUrl }] }
 */

export type YouTubeResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
};

export class SearchError extends Error {
  constructor(
    public readonly kind: 'not-configured' | 'network' | 'server' | 'bad-response',
    message: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 10_000;

export function searchBaseUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL;
  return base ? base.replace(/\/+$/, '') : null;
}

export function parseResults(body: unknown): YouTubeResult[] {
  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as { items?: unknown }).items)
  ) {
    throw new SearchError('bad-response', 'The search service returned an unexpected response.');
  }
  return (body as { items: unknown[] }).items.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const i = item as Record<string, unknown>;
    if (typeof i.videoId !== 'string' || !i.videoId || typeof i.title !== 'string') return [];
    return [
      {
        videoId: i.videoId,
        title: i.title,
        channelTitle: typeof i.channelTitle === 'string' ? i.channelTitle : '',
        thumbnailUrl: typeof i.thumbnailUrl === 'string' ? i.thumbnailUrl : null,
      },
    ];
  });
}

export async function searchYouTube(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubeResult[]> {
  const base = searchBaseUrl();
  if (!base) {
    throw new SearchError('not-configured', 'YouTube search isn’t set up for this build yet.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(`${base}/youtube/search?q=${encodeURIComponent(query.trim())}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new SearchError('network', 'Couldn’t reach the search service. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    throw new SearchError('server', `Search failed (${response.status}). Try again in a moment.`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new SearchError('bad-response', 'The search service returned an unexpected response.');
  }
  return parseResults(body);
}
