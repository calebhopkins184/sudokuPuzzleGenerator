import { describe, expect, it } from '@jest/globals';

import {
  initialEngine,
  onClipFailed,
  onClipFinished,
  onMainEnded,
  onTimeUpdate,
  playClipNow,
  startInsert,
  userSeek,
  type EngineClip,
  type EngineState,
  type StartInsertInput,
} from '../engine';

const insert = (overrides: Partial<StartInsertInput> = {}): StartInsertInput => ({
  variant: 'replay',
  now: 20,
  duration: 60,
  playing: true,
  windowSec: 5,
  slowRate: 0.5,
  baseRate: 1,
  ...overrides,
});

const tick = (state: EngineState, time: number, clips: EngineClip[] = [], playing = true) =>
  onTimeUpdate(state, { time, playing, clips, autoPlayClips: true, baseRate: 1 });

describe('replay and slow motion', () => {
  it('plays the preceding window, then returns to T and keeps playing', () => {
    const started = startInsert(initialEngine(20), insert());
    expect(started.effects).toEqual([
      { type: 'rate', rate: 1 },
      { type: 'seek', time: 15 },
      { type: 'play' },
    ]);
    expect(tick(started.state, 17).effects).toEqual([]);
    const done = tick(started.state, 19.97);
    expect(done.state.mode.kind).toBe('normal');
    expect(done.effects).toEqual([
      { type: 'rate', rate: 1 },
      { type: 'seek', time: 20 },
      { type: 'play' },
    ]);
  });

  it('slow motion uses the same interval at the slow rate, then restores the chosen speed', () => {
    const started = startInsert(
      initialEngine(20),
      insert({ variant: 'slow', baseRate: 0.5, slowRate: 0.25 }),
    );
    expect(started.effects[0]).toEqual({ type: 'rate', rate: 0.25 });
    expect(started.effects[1]).toEqual({ type: 'seek', time: 15 });
    const done = onTimeUpdate(started.state, {
      time: 20,
      playing: true,
      clips: [],
      autoPlayClips: true,
      baseRate: 0.5,
    });
    expect(done.effects[0]).toEqual({ type: 'rate', rate: 0.5 });
  });

  it('returns paused if the coach started from pause', () => {
    const started = startInsert(initialEngine(20), insert({ playing: false }));
    expect(tick(started.state, 20).effects.at(-1)).toEqual({ type: 'pause' });
  });

  // Boundary 1
  it('does nothing (with a notice) when there is under 0.25 s to replay', () => {
    const state = initialEngine(0.1);
    const step = startInsert(state, insert({ now: 0.1 }));
    expect(step.state).toBe(state);
    expect(step.effects).toEqual([
      { type: 'toast', message: 'Nothing before this moment to replay' },
    ]);
  });

  // Boundary 2
  it('clamps the window at zero near the start', () => {
    const step = startInsert(initialEngine(2), insert({ now: 2 }));
    expect(step.effects).toContainEqual({ type: 'seek', time: 0 });
    expect(step.state.mode).toMatchObject({ kind: 'insert', start: 0, end: 2 });
  });

  // Boundary 3
  it('clamps T to the duration and finishes parked at the end, paused', () => {
    const step = startInsert(initialEngine(60), insert({ now: 60.4, duration: 60 }));
    expect(step.state.mode).toMatchObject({
      kind: 'insert',
      returnTo: 60,
      start: 55,
      resumePlaying: false,
    });
    // Time updates may never report exactly the end; playToEnd finishes the insert.
    const ended = onMainEnded(step.state, { duration: 60, baseRate: 1 });
    expect(ended.state.mode.kind).toBe('normal');
    expect(ended.effects).toEqual([
      { type: 'rate', rate: 1 },
      { type: 'seek', time: 60 },
      { type: 'pause' },
    ]);
  });

  // Boundary 4
  it('repeated taps restart from the ORIGINAL moment (no nesting)', () => {
    const first = startInsert(initialEngine(20), insert());
    // Mid-replay the player is at 17; tapping again must not replay 12..17.
    const second = startInsert(first.state, insert({ now: 17 }));
    expect(second.state.mode).toMatchObject({ kind: 'insert', returnTo: 20, start: 15 });
    expect(second.effects).toContainEqual({ type: 'seek', time: 15 });
  });

  // Boundary 5
  it('switching replay -> slow mid-insert keeps T and the original play state', () => {
    const first = startInsert(initialEngine(20), insert({ playing: false }));
    const slow = startInsert(first.state, insert({ variant: 'slow', now: 18, playing: true }));
    expect(slow.state.mode).toMatchObject({
      kind: 'insert',
      variant: 'slow',
      returnTo: 20,
      resumePlaying: false,
    });
  });

  // Boundary 6
  it('a user seek during replay cancels it and resets the rate', () => {
    const started = startInsert(initialEngine(20), insert({ variant: 'slow' }));
    const seek = userSeek(started.state, 42, 1);
    expect(seek.state).toEqual({ mode: { kind: 'normal' }, lastTime: 42 });
    expect(seek.effects).toEqual([
      { type: 'rate', rate: 1 },
      { type: 'seek', time: 42 },
    ]);
    // Later time updates must not "finish" a replay that no longer exists.
    expect(tick(seek.state, 42.1).effects).toEqual([]);
  });
});

describe('inserted clips', () => {
  const a: EngineClip = { id: 'a', timeSec: 10, createdAt: '1' };
  const b: EngineClip = { id: 'b', timeSec: 10, createdAt: '2' };
  const c: EngineClip = { id: 'c', timeSec: 10.3, createdAt: '3' };

  it('plays a clip when playback crosses it, then returns to its moment', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [a]);
    expect(crossed.effects).toEqual([{ type: 'pause' }, { type: 'playClip', clipId: 'a' }]);
    const done = onClipFinished(crossed.state, { baseRate: 1 });
    expect(done.effects).toEqual([
      { type: 'stopClip' },
      { type: 'rate', rate: 1 },
      { type: 'seek', time: 10 },
      { type: 'play' },
    ]);
  });

  // Boundary 7
  it('returning from a clip does not re-trigger it', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [a]);
    const back = onClipFinished(crossed.state, { baseRate: 1 });
    expect(tick(back.state, 10.1, [a]).effects).toEqual([]);
  });

  it('returning from a replay does not re-trigger a clip before T', () => {
    const started = startInsert(initialEngine(20), insert());
    const back = tick(started.state, 20, [{ id: 'x', timeSec: 17 }]);
    expect(tick(back.state, 20.1, [{ id: 'x', timeSec: 17 }]).effects).toEqual([]);
  });

  // Boundary 8
  it('plays clips at the same moment back to back, then returns once', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [b, a]);
    expect(crossed.effects).toContainEqual({ type: 'playClip', clipId: 'a' });
    const second = onClipFinished(crossed.state, { baseRate: 1 });
    expect(second.effects).toEqual([{ type: 'playClip', clipId: 'b' }]);
    const done = onClipFinished(second.state, { baseRate: 1 });
    expect(done.effects).toContainEqual({ type: 'seek', time: 10 });
  });

  it('adjacent clips play in turn as playback continues', () => {
    const first = tick(initialEngine(9.95), 10.05, [a, c]);
    expect(first.effects).toContainEqual({ type: 'playClip', clipId: 'a' });
    const back = onClipFinished(first.state, { baseRate: 1 });
    const next = tick(back.state, 10.35, [a, c]);
    expect(next.effects).toContainEqual({ type: 'playClip', clipId: 'c' });
  });

  // Boundary 9
  it('seeking past a clip does not trigger it', () => {
    const seek = userSeek(initialEngine(5), 30, 1);
    expect(tick(seek.state, 30.1, [a]).effects).toEqual([]);
    // Large unexplained jumps are treated as seeks too.
    expect(tick(initialEngine(5), 12, [a]).effects).toEqual([]);
  });

  it('paused frame steps over a clip do not trigger it', () => {
    expect(tick(initialEngine(9.99), 10.02, [a], false).effects).toEqual([]);
  });

  it('respects the auto-play setting', () => {
    const step = onTimeUpdate(initialEngine(9.9), {
      time: 10.05,
      playing: true,
      clips: [a],
      autoPlayClips: false,
      baseRate: 1,
    });
    expect(step.effects).toEqual([]);
  });

  // Boundary 10
  it('a missing clip is skipped with a notice', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [a]);
    const failed = onClipFailed(crossed.state, { baseRate: 1 });
    expect(failed.effects[0]).toEqual({ type: 'toast', message: 'Clip unavailable — skipped' });
    expect(failed.state.mode.kind).toBe('normal');
  });

  it('replay is refused while a clip is playing', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [a]);
    const step = startInsert(crossed.state, insert({ now: 10 }));
    expect(step.state).toBe(crossed.state);
    expect(step.effects[0]).toMatchObject({ type: 'toast' });
  });

  it('tapping a clip plays it and returns to its moment with the prior play state', () => {
    const step = playClipNow(initialEngine(40), a, false);
    expect(step.effects).toEqual([
      { type: 'pause' },
      { type: 'seek', time: 10 },
      { type: 'playClip', clipId: 'a' },
    ]);
    expect(onClipFinished(step.state, { baseRate: 1 }).effects.at(-1)).toEqual({ type: 'pause' });
  });

  it('seeking during a clip stops it', () => {
    const crossed = tick(initialEngine(9.9), 10.05, [a]);
    expect(userSeek(crossed.state, 3, 1).effects).toEqual([
      { type: 'stopClip' },
      { type: 'seek', time: 3 },
    ]);
  });
});
