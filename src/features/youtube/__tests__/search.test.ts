import { afterEach, describe, expect, it } from '@jest/globals';

import { SearchError, parseResults, searchYouTube } from '../search';

const ORIGINAL = process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL;

afterEach(() => {
  process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL = ORIGINAL;
});

const ok = (body: unknown) =>
  (async () => ({ ok: true, status: 200, json: async () => body })) as unknown as typeof fetch;

describe('searchYouTube', () => {
  it('reports when search is not configured', async () => {
    delete process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL;
    await expect(searchYouTube('double leg')).rejects.toMatchObject({ kind: 'not-configured' });
  });

  it('calls the proxy (never YouTube directly) with an encoded query', async () => {
    process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL = 'https://api.example.com/';
    let called = '';
    const fetchImpl = (async (url: string) => {
      called = url;
      return { ok: true, status: 200, json: async () => ({ items: [] }) };
    }) as unknown as typeof fetch;
    await searchYouTube(' high crotch ', fetchImpl);
    expect(called).toBe('https://api.example.com/youtube/search?q=high%20crotch');
  });

  it('maps network failures and HTTP errors to readable errors', async () => {
    process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL = 'https://api.example.com';
    const offline = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(searchYouTube('x', offline)).rejects.toMatchObject({ kind: 'network' });
    const fail = (async () => ({ ok: false, status: 502 })) as unknown as typeof fetch;
    await expect(searchYouTube('x', fail)).rejects.toBeInstanceOf(SearchError);
  });

  it('returns parsed results', async () => {
    process.env.EXPO_PUBLIC_MAT_REVIEW_API_URL = 'https://api.example.com';
    const results = await searchYouTube(
      'x',
      ok({
        items: [{ videoId: 'abc', title: 'Single leg', channelTitle: 'Coach', thumbnailUrl: null }],
      }),
    );
    expect(results).toEqual([
      { videoId: 'abc', title: 'Single leg', channelTitle: 'Coach', thumbnailUrl: null },
    ]);
  });
});

describe('parseResults', () => {
  it('skips malformed items and rejects malformed bodies', () => {
    expect(
      parseResults({ items: [{ title: 'no id' }, null, { videoId: 'a', title: 'A' }] }),
    ).toEqual([{ videoId: 'a', title: 'A', channelTitle: '', thumbnailUrl: null }]);
    expect(() => parseResults({ nope: true })).toThrow(SearchError);
  });
});
