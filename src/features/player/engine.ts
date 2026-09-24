/**
 * Playback engine for inserted segments (replay, slow motion, inserted clips).
 *
 * Pure and platform-free: every function takes the current state plus inputs and
 * returns the next state and a list of effects for the player hook to apply. That
 * keeps the boundary cases in docs/PRODUCT_CONTRACT.md unit-testable.
 */

export type EngineClip = { id: string; timeSec: number; createdAt?: string };

export type InsertVariant = 'replay' | 'slow';

export type Mode =
  | { kind: 'normal' }
  | {
      kind: 'insert';
      variant: InsertVariant;
      /** The moment the coach tapped; playback always returns here. */
      returnTo: number;
      start: number;
      end: number;
      resumePlaying: boolean;
    }
  | {
      kind: 'clip';
      queue: EngineClip[];
      index: number;
      returnTo: number;
      resumePlaying: boolean;
    };

export type EngineState = {
  mode: Mode;
  /** Last main-video time seen during normal playback; used to detect crossing a clip. */
  lastTime: number;
};

export type Effect =
  | { type: 'seek'; time: number }
  | { type: 'rate'; rate: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'playClip'; clipId: string }
  | { type: 'stopClip' }
  | { type: 'toast'; message: string };

export type Step = { state: EngineState; effects: Effect[] };

/** Shortest segment worth replaying. */
export const MIN_REPLAY_SEC = 0.25;
/** Tolerance for "reached the end" given ~0.1 s time-update granularity. */
export const END_EPSILON = 0.05;
/** A forward jump larger than this is a seek, not playback, so it never triggers clips. */
export const MAX_CROSS_GAP = 1.0;

export function initialEngine(lastTime = 0): EngineState {
  return { mode: { kind: 'normal' }, lastTime };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function finish(
  returnTo: number,
  resumePlaying: boolean,
  baseRate: number,
  extra: Effect[] = [],
): Step {
  return {
    state: { mode: { kind: 'normal' }, lastTime: returnTo },
    effects: [
      ...extra,
      { type: 'rate', rate: baseRate },
      { type: 'seek', time: returnTo },
      resumePlaying ? { type: 'play' } : { type: 'pause' },
    ],
  };
}

export type StartInsertInput = {
  variant: InsertVariant;
  now: number;
  duration: number;
  playing: boolean;
  windowSec: number;
  slowRate: number;
  baseRate: number;
};

/** Replay (at the current speed) or slow-mo the interval before the tapped moment. */
export function startInsert(state: EngineState, input: StartInsertInput): Step {
  const { mode } = state;
  if (mode.kind === 'clip') {
    return { state, effects: [{ type: 'toast', message: 'Finish or skip the clip first' }] };
  }

  // Repeated taps (or switching replay <-> slow) keep the ORIGINAL moment: inserts never nest.
  const duration = input.duration > 0 ? input.duration : Number.POSITIVE_INFINITY;
  const returnTo = mode.kind === 'insert' ? mode.returnTo : clamp(input.now, 0, duration);
  const resumePlaying =
    mode.kind === 'insert'
      ? mode.resumePlaying
      : input.playing && returnTo < duration - END_EPSILON;

  const start = Math.max(0, returnTo - input.windowSec);
  if (returnTo - start < MIN_REPLAY_SEC) {
    return { state, effects: [{ type: 'toast', message: 'Nothing before this moment to replay' }] };
  }

  const rate = input.variant === 'slow' ? input.slowRate : input.baseRate;
  return {
    state: {
      ...state,
      mode: {
        kind: 'insert',
        variant: input.variant,
        returnTo,
        start,
        end: returnTo,
        resumePlaying,
      },
    },
    effects: [{ type: 'rate', rate }, { type: 'seek', time: start }, { type: 'play' }],
  };
}

export type TimeUpdateInput = {
  time: number;
  /** Only real playback crosses clips; paused frame steps and scrub previews never do. */
  playing: boolean;
  clips: EngineClip[];
  autoPlayClips: boolean;
  baseRate: number;
};

const byTime = (a: EngineClip, b: EngineClip) =>
  a.timeSec - b.timeSec || (a.createdAt ?? '').localeCompare(b.createdAt ?? '');

export function onTimeUpdate(state: EngineState, input: TimeUpdateInput): Step {
  const { mode } = state;

  if (mode.kind === 'insert') {
    if (input.time >= mode.end - END_EPSILON) {
      return finish(mode.returnTo, mode.resumePlaying, input.baseRate);
    }
    return { state, effects: [] };
  }

  if (mode.kind === 'clip') return { state, effects: [] };

  const prev = state.lastTime;
  const delta = input.time - prev;
  const crossed =
    input.playing && input.autoPlayClips && delta > 0 && delta <= MAX_CROSS_GAP
      ? input.clips.filter((c) => c.timeSec > prev && c.timeSec <= input.time).sort(byTime)
      : [];

  if (crossed.length === 0) return { state: { ...state, lastTime: input.time }, effects: [] };

  const returnTo = crossed[crossed.length - 1].timeSec;
  return {
    state: {
      mode: { kind: 'clip', queue: crossed, index: 0, returnTo, resumePlaying: true },
      lastTime: returnTo,
    },
    effects: [{ type: 'pause' }, { type: 'playClip', clipId: crossed[0].id }],
  };
}

/** The main video reached its end (the time-update may never report exactly `end`). */
export function onMainEnded(
  state: EngineState,
  input: { duration: number; baseRate: number },
): Step {
  const { mode } = state;
  if (mode.kind === 'insert') return finish(mode.returnTo, false, input.baseRate);
  return { state: { ...state, lastTime: input.duration }, effects: [] };
}

/** An inserted clip finished (or was skipped): play the next queued clip or return. */
export function onClipFinished(state: EngineState, input: { baseRate: number }): Step {
  const { mode } = state;
  if (mode.kind !== 'clip') return { state, effects: [] };
  const next = mode.index + 1;
  if (next < mode.queue.length) {
    return {
      state: { ...state, mode: { ...mode, index: next } },
      effects: [{ type: 'playClip', clipId: mode.queue[next].id }],
    };
  }
  return finish(mode.returnTo, mode.resumePlaying, input.baseRate, [{ type: 'stopClip' }]);
}

export function onClipFailed(state: EngineState, input: { baseRate: number }): Step {
  if (state.mode.kind !== 'clip') return { state, effects: [] };
  const step = onClipFinished(state, input);
  return {
    ...step,
    effects: [{ type: 'toast', message: 'Clip unavailable — skipped' }, ...step.effects],
  };
}

/** Coach tapped a clip in the list: jump to its moment and play it, then return there. */
export function playClipNow(state: EngineState, clip: EngineClip, playing: boolean): Step {
  const cleanup: Effect[] = state.mode.kind === 'clip' ? [{ type: 'stopClip' }] : [];
  return {
    state: {
      mode: {
        kind: 'clip',
        queue: [clip],
        index: 0,
        returnTo: clip.timeSec,
        resumePlaying: playing,
      },
      lastTime: clip.timeSec,
    },
    effects: [
      ...cleanup,
      { type: 'pause' },
      { type: 'seek', time: clip.timeSec },
      { type: 'playClip', clipId: clip.id },
    ],
  };
}

/**
 * Any user-initiated seek (scrub, skip, frame step, jump to mark). The user's intent
 * wins: an active replay or clip is cancelled and speed returns to the chosen rate.
 */
export function userSeek(state: EngineState, time: number, baseRate: number): Step {
  const { mode } = state;
  const effects: Effect[] = [];
  if (mode.kind === 'insert') effects.push({ type: 'rate', rate: baseRate });
  if (mode.kind === 'clip') effects.push({ type: 'stopClip' });
  effects.push({ type: 'seek', time });
  return { state: { mode: { kind: 'normal' }, lastTime: time }, effects };
}
