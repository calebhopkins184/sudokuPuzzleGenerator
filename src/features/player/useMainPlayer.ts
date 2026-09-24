import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { mediaUri } from '@/features/media/mediaFiles';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { MediaRef, Session } from '@/features/sessions/types';
import { clamp } from '@/lib/time';

export const PLAYBACK_RATES = [0.25, 0.5, 1] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

const FRAME_SEC = 1 / 30;
const SCRUB_SEEK_INTERVAL_MS = 80;
const SAVE_POSITION_INTERVAL_MS = 5000;

export type MainPlayer = ReturnType<typeof useMainPlayer>;

/** Binds an expo-video player to a session's main footage. */
export function useMainPlayer(session: Session, media: MediaRef) {
  const { dispatch } = useSessions();
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

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    positionRef.current = currentTime;
    if (!scrubbing.current) setTime(currentTime);
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

  const seekTo = useCallback(
    (t: number) => {
      const target = clamp(t, 0, player.duration || duration || t);
      player.currentTime = target;
      positionRef.current = target;
      setTime(target);
    },
    [player, duration],
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
      player.playbackRate = next;
      setRateState(next);
    },
    [player],
  );

  const scrubStart = useCallback(() => {
    scrubbing.current = { wasPlaying: player.playing, lastSeek: 0 };
    player.pause(); // Apple recommends pausing while scrubbing for smooth seeks.
  }, [player]);

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
  };
}
