import { describe, expect, it } from '@jest/globals';

import { EMPTY_STATE, orphanedFiles, parsePersisted, sessionsReducer } from '../reducer';
import type { MediaRef, PersistedState, Session } from '../types';

const media = (id: string, extra: Partial<MediaRef> = {}): MediaRef => ({
  id,
  fileName: `${id}.mov`,
  thumbFileName: `${id}.jpg`,
  source: 'library',
  originalName: null,
  durationSec: 60,
  width: 1920,
  height: 1080,
  sizeBytes: 1000,
  compressed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
});

const session = (extra: Partial<Session> = {}): Session => ({
  id: 's1',
  title: 'Match',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  mainMediaId: 'm1',
  media: { m1: media('m1'), c1: media('c1') },
  annotations: [],
  clips: [
    {
      id: 'clip1',
      timeSec: 10,
      mediaId: 'c1',
      label: 'Setup',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  lastPositionSec: 12,
  ...extra,
});

const withSession = (s: Session = session()): PersistedState => ({ ...EMPTY_STATE, sessions: [s] });

describe('sessionsReducer', () => {
  it('ignores blank renames', () => {
    const state = withSession();
    expect(sessionsReducer(state, { type: 'renameSession', sessionId: 's1', title: '   ' })).toBe(
      state,
    );
  });

  it('keeps annotations sorted by time', () => {
    let state = withSession();
    for (const t of [30, 5, 12]) {
      state = sessionsReducer(state, {
        type: 'addAnnotation',
        sessionId: 's1',
        annotation: {
          id: `n${t}`,
          kind: 'note',
          timeSec: t,
          text: 'x',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
    }
    expect(state.sessions[0].annotations.map((a) => a.timeSec)).toEqual([5, 12, 30]);
  });

  it('replacing main footage drops the old media and resets position', () => {
    const state = sessionsReducer(withSession(), {
      type: 'setMainMedia',
      sessionId: 's1',
      media: media('m2'),
    });
    const s = state.sessions[0];
    expect(s.mainMediaId).toBe('m2');
    expect(s.media.m1).toBeUndefined();
    expect(s.lastPositionSec).toBe(0);
  });

  it('removing clip media removes clips that reference it', () => {
    const state = sessionsReducer(withSession(), {
      type: 'removeMedia',
      sessionId: 's1',
      mediaId: 'c1',
    });
    expect(state.sessions[0].clips).toEqual([]);
  });

  it('does not bump updatedAt for resume position', () => {
    const state = sessionsReducer(withSession(), {
      type: 'setLastPosition',
      sessionId: 's1',
      positionSec: 40,
    });
    expect(state.sessions[0].updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(state.sessions[0].lastPositionSec).toBe(40);
  });
});

describe('orphanedFiles', () => {
  it('lists every file for a deleted session', () => {
    expect(orphanedFiles(withSession(), { type: 'deleteSession', sessionId: 's1' }).sort()).toEqual(
      ['c1.jpg', 'c1.mov', 'm1.jpg', 'm1.mov'].sort(),
    );
  });

  it('lists the clip file when a clip is deleted', () => {
    expect(
      orphanedFiles(withSession(), { type: 'deleteClip', sessionId: 's1', clipId: 'clip1' }),
    ).toEqual(['c1.mov', 'c1.jpg']);
  });
});

describe('parsePersisted', () => {
  it('returns an empty library when nothing is stored', () => {
    expect(parsePersisted(null)).toEqual(EMPTY_STATE);
  });

  it('round-trips valid data', () => {
    const state = withSession();
    expect(parsePersisted(JSON.stringify(state))).toEqual(state);
  });

  it('drops damaged entries instead of crashing', () => {
    const raw = JSON.stringify({
      version: 1,
      sessions: [
        { nope: true },
        { ...session(), mainMediaId: 'gone', clips: [{ id: 'x', timeSec: 1, mediaId: 'gone' }] },
      ],
      settings: { replayWindowSec: 7, slowRate: 0.5 },
    });
    const parsed = parsePersisted(raw);
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.sessions[0].mainMediaId).toBeNull();
    expect(parsed.sessions[0].clips).toEqual([]);
    expect(parsed.settings.replayWindowSec).toBe(5);
  });

  it('throws on unreadable data so the UI can offer recovery', () => {
    expect(() => parsePersisted('{oops')).toThrow();
    expect(() => parsePersisted(JSON.stringify({ version: 99 }))).toThrow();
  });
});
