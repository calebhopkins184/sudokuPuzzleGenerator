import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { clamp } from '@/lib/time';
import { colors, radius } from '@/theme';

export type TimelineMarker = {
  id: string;
  timeSec: number;
  kind: 'note' | 'link' | 'clip';
};

type Props = {
  duration: number;
  time: number;
  markers: TimelineMarker[];
  /** Highlighted range, e.g. the active replay window. */
  highlight?: { start: number; end: number } | null;
  onScrubStart: () => void;
  /** Called while dragging (final=false, throttled by the caller) and on release (final=true). */
  onScrub: (timeSec: number, final: boolean) => void;
};

const TRACK_HEIGHT = 6;
const THUMB = 18;
const HIT_HEIGHT = 48;

const MARKER_COLOR: Record<TimelineMarker['kind'], string> = {
  note: colors.note,
  link: colors.link,
  clip: colors.clip,
};

/**
 * Scrubber with its own drag state: while the finger is down, the playhead follows the
 * finger and ignores incoming player time updates, so it never snaps back mid-drag.
 */
export function Timeline({ duration, time, markers, highlight, onScrubStart, onScrub }: Props) {
  const [width, setWidth] = useState(0);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const drag = useRef({ startX: 0, pageX0: 0 });
  // Refs keep the PanResponder (created once) reading fresh values.
  const live = useRef({ width, duration, onScrub, onScrubStart });
  live.current = { width, duration, onScrub, onScrubStart };

  const timeAt = (x: number) => {
    const { width: w, duration: d } = live.current;
    return w > 0 && d > 0 ? clamp(x / w, 0, 1) * d : 0;
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          drag.current = { startX: evt.nativeEvent.locationX, pageX0: evt.nativeEvent.pageX };
          const t = timeAt(drag.current.startX);
          live.current.onScrubStart();
          setDragTime(t);
          live.current.onScrub(t, false);
        },
        onPanResponderMove: (evt) => {
          const x = drag.current.startX + (evt.nativeEvent.pageX - drag.current.pageX0);
          const t = timeAt(x);
          setDragTime(t);
          live.current.onScrub(t, false);
        },
        onPanResponderRelease: (evt) => {
          const x = drag.current.startX + (evt.nativeEvent.pageX - drag.current.pageX0);
          live.current.onScrub(timeAt(x), true);
          setDragTime(null);
        },
        onPanResponderTerminate: () => setDragTime(null),
      }),
    [],
  );

  const shown = dragTime ?? time;
  const pct = (t: number) => (duration > 0 ? clamp(t / duration, 0, 1) * 100 : 0);

  return (
    <View
      style={styles.hitArea}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Timeline"
      accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(shown) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const step = e.nativeEvent.actionName === 'increment' ? 5 : -5;
        onScrub(clamp(time + step, 0, duration), true);
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track} pointerEvents="none">
        {highlight ? (
          <View
            style={[
              styles.highlight,
              {
                left: `${pct(highlight.start)}%`,
                width: `${Math.max(0, pct(highlight.end) - pct(highlight.start))}%`,
              },
            ]}
          />
        ) : null}
        <View style={[styles.progress, { width: `${pct(shown)}%` }]} />
      </View>
      {markers.map((m) => (
        <View
          key={m.id}
          pointerEvents="none"
          style={[
            styles.marker,
            { left: `${pct(m.timeSec)}%`, backgroundColor: MARKER_COLOR[m.kind] },
          ]}
        />
      ))}
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: `${pct(shown)}%` }, dragTime !== null && styles.thumbActive]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: HIT_HEIGHT, justifyContent: 'center' },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progress: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.accent },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.replay,
    opacity: 0.45,
  },
  marker: {
    position: 'absolute',
    top: HIT_HEIGHT / 2 - 14,
    width: 3,
    height: 10,
    marginLeft: -1.5,
    borderRadius: 1.5,
  },
  thumb: {
    position: 'absolute',
    top: HIT_HEIGHT / 2 - THUMB / 2,
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    borderRadius: THUMB / 2,
    backgroundColor: colors.text,
  },
  thumbActive: { transform: [{ scale: 1.35 }] },
});
