import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useToast } from '@/components/Toast';
import { mediaUri } from '@/features/media/mediaFiles';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { MediaRef, Session } from '@/features/sessions/types';
import { clamp } from '@/lib/time';

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
  type Effect,
  type InsertVariant,
  type Mode,
  type Step,
} from './engine';

export const PLAYBACK_RATES = [0.25, 0.5, 1] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

const FRAME_SEC = 1 / 30;
const SCRUB_SEEK_INTERVAL_MS = 80;
const SAVE_POSITION_INTERVAL_MS = 5000;

export type MainPlayer = ReturnType<typeof useMainPlayer>;

/** Plays inserted clips on behalf of the engine (implemented by the clip overlay). */
export type ClipController = { play: (clipId: string) => void; stop: () => void };

/**
 * Binds an expo-video player to a session's main footage and drives the playback
 * engine (replay, slow motion, inserted clips) from its events.
 */
export function useMainPlayer(session: Session, media: MediaRef) {
  const { state, dispatch } = useSessions();
  const toast = useToast();
  const player = useVideoPlayer({ uri: mediaUri(media.fileName) }, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
    p.keepScreenOnWhilePlaying = true;
    p.preservesPitch = true;
    p.seekTolerance = { toleranceBefore: 0, toleranceAfter: 0 };
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const [time, setTime] = useState(session.lastPositionSec);
  const [duration, setDuration] = useState(media.durationSec ?? 0);
  const [rate, setRateState] = useState<PlaybackRate>(1);
  const scrubbing = useRef<{ wasPlaying: boolean; lastSeek: number } | null>(null);
  const restored = useRef(false);
  // Latest known position; readable even after the native player is released on unmount.
  const positionRef = useRef(session.lastPositionSec);

  const engine = useRef(initialEngine(session.lastPositionSec));
  const [mode, setMode] = useState<Mode>(engine.current.mode);
  const clipController = useRef<ClipController | null>(null);
  // Fresh values for event callbacks without re-subscribing.
  const live = useRef({ rate, duration, clips: [] as EngineClip[], settings: state.settings });
  live.current = { rate, duration, clips: session.clips, settings: state.settings };

  const run = useCallback(
    (step: Step) => {
      engine.current = step.state;
      setMode(step.state.mode);
      const apply = (effect: Effect) => {
        switch (effect.type) {
          case 'seek': {
            const d = player.duration || live.current.duration;
            const target = clamp(effect.time, 0, d > 0 ? d : effect.time);
            player.currentTime = target;
            positionRef.current = target;
            setTime(target);
            break;
          }
          case 'rate':
            player.playbackRate = effect.rate;
            break;
          case 'play':
            player.play();
            break;
          case 'pause':
            player.pause();
            break;
          case 'playClip':
            if (clipController.current) clipController.current.play(effect.clipId);
            else
              queueMicrotask(() =>
                run(onClipFailed(engine.current, { baseRate: live.current.rate })),
              );
            break;
          case 'stopClip':
            clipController.current?.stop();
            break;
          case 'toast':
            toast(effect.message);
            break;
        }
      };
      step.effects.forEach(apply);
    },
    [player, toast],
  );

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    positionRef.current = currentTime;
    if (scrubbing.current) return;
    setTime(currentTime);
    const step = onTimeUpdate(engine.current, {
      time: currentTime,
      playing: player.playing,
      clips: live.current.clips,
      autoPlayClips: live.current.settings.autoPlayClips,
      baseRate: live.current.rate,
    });
    if (step.state !== engine.current || step.effects.length) run(step);
  });

  useEventListener(player, 'playToEnd', () => {
    run(onMainEnded(engine.current, { duration: player.duration, baseRate: live.current.rate }));
  });

  useEventListener(player, 'sourceLoad', ({ duration: d }) => {
    if (d > 0) {
      setDuration(d);
      if (!media.durationSec || Math.abs(media.durationSec - d) > 0.5) {
        dispatch({
          type: 'updateMedia',
          sessionId: session.id,
          mediaId: media.id,
          patch: { durationSec: d },
        });
      }
    }
  });

  // Resume where the coach left off, once the video is ready.
  useEffect(() => {
    if (status !== 'readyToPlay' || restored.current) return;
    restored.current = true;
    const d = player.duration || duration;
    if (d > 0) setDuration(d);
    const resumeAt = session.lastPositionSec;
    if (resumeAt > 0 && (d === 0 || resumeAt < d - 0.5)) {
      player.currentTime = resumeAt;
      positionRef.current = resumeAt;
      setTime(resumeAt);
    }
  }, [status, player, duration, session.lastPositionSec]);

  // Persist position periodically, on pause, when backgrounded and on exit.
  const savePosition = useCallback(() => {
    dispatch({ type: 'setLastPosition', sessionId: session.id, positionSec: positionRef.current });
  }, [dispatch, session.id]);

  useEffect(() => {
    if (!isPlaying) savePosition();
    if (!isPlaying) return;
    const id = setInterval(savePosition, SAVE_POSITION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, savePosition]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        savePosition();
        player.pause();
      }
    });
    return () => {
      sub.remove();
      savePosition();
    };
  }, [player, savePosition]);

  /** User-initiated seek: cancels any replay or clip (the coach's intent wins). */
  const seekTo = useCallback(
    (t: number) => run(userSeek(engine.current, t, live.current.rate)),
    [run],
  );

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      return;
    }
    // Restart from the beginning if we're parked at the end.
    const d = player.duration;
    if (d > 0 && player.currentTime >= d - 0.05) seekTo(0);
    player.play();
  }, [player, seekTo]);

  const skip = useCallback((delta: number) => seekTo(player.currentTime + delta), [player, seekTo]);

  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      player.pause();
      seekTo(player.currentTime + direction * FRAME_SEC);
    },
    [player, seekTo],
  );

  const setRate = useCallback(
    (next: PlaybackRate) => {
      // During slow motion the insert owns the rate; the new speed applies on return.
      const m = engine.current.mode;
      if (!(m.kind === 'insert' && m.variant === 'slow')) player.playbackRate = next;
      setRateState(next);
    },
    [player],
  );

  const insert = useCallback(
    (variant: InsertVariant) =>
      run(
        startInsert(engine.current, {
          variant,
          now: player.currentTime,
          duration: player.duration || live.current.duration,
          playing: player.playing,
          windowSec: live.current.settings.replayWindowSec,
          slowRate: live.current.settings.slowRate,
          baseRate: live.current.rate,
        }),
      ),
    [player, run],
  );

  const playClip = useCallback(
    (clip: EngineClip) => run(playClipNow(engine.current, clip, player.playing)),
    [player, run],
  );
  const clipFinished = useCallback(
    () => run(onClipFinished(engine.current, { baseRate: live.current.rate })),
    [run],
  );
  const clipFailed = useCallback(
    () => run(onClipFailed(engine.current, { baseRate: live.current.rate })),
    [run],
  );

  const scrubStart = useCallback(() => {
    const inClip = engine.current.mode.kind === 'clip';
    scrubbing.current = { wasPlaying: player.playing, lastSeek: 0 };
    if (engine.current.mode.kind !== 'normal') {
      run(userSeek(engine.current, player.currentTime, live.current.rate));
    }
    if (inClip) scrubbing.current.wasPlaying = false;
    player.pause(); // Apple recommends pausing while scrubbing for smooth seeks.
  }, [player, run]);

  const scrub = useCallback(
    (t: number, final: boolean) => {
      const state = scrubbing.current;
      const now = Date.now();
      if (!final && state && now - state.lastSeek < SCRUB_SEEK_INTERVAL_MS) return;
      if (state) state.lastSeek = now;
      if (!final) {
        player.currentTime = t;
        return;
      }
      seekTo(t);
      const resume = state?.wasPlaying ?? false;
      scrubbing.current = null;
      if (resume) player.play();
    },
    [player, seekTo],
  );

  const retry = useCallback(() => {
    restored.current = false;
    void player.replaceAsync({ uri: mediaUri(media.fileName) });
  }, [player, media.fileName]);

  return {
    player: player as VideoPlayer,
    status,
    error: error?.message ?? null,
    isPlaying,
    time,
    duration,
    rate,
    togglePlay,
    seekTo,
    skip,
    stepFrame,
    setRate,
    scrubStart,
    scrub,
    retry,
    mode,
    insert,
    playClip,
    clipFinished,
    clipFailed,
    clipController,
  };
}
