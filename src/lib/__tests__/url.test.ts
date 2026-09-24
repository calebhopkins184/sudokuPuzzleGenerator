import { describe, expect, it } from '@jest/globals';

import { hostOf, normalizeUrl, youtubeWatchUrl } from '../url';

describe('normalizeUrl', () => {
  it('adds https when missing', () => {
    expect(normalizeUrl('youtube.com/watch?v=abc')).toBe('https://youtube.com/watch?v=abc');
  });

  it('keeps valid http(s) links', () => {
    expect(normalizeUrl(' https://example.com/a ')).toBe('https://example.com/a');
    expect(normalizeUrl('http://example.org')).toBe('http://example.org');
  });

  it('rejects junk and non-web schemes', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('double leg')).toBeNull();
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('ftp://example.com')).toBeNull();
    expect(normalizeUrl('https://nodot')).toBeNull();
  });
});

describe('hostOf / youtubeWatchUrl', () => {
  it('extracts a readable host', () => {
    expect(hostOf('https://www.youtube.com/watch?v=x')).toBe('youtube.com');
  });

  it('builds a watch URL', () => {
    expect(youtubeWatchUrl('a b')).toBe('https://www.youtube.com/watch?v=a%20b');
  });
});
