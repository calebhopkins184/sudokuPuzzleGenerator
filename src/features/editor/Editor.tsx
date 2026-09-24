import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { MediaRef, Session } from '@/features/sessions/types';
import { PlayerSurface } from '@/features/player/PlayerSurface';
import { Timeline, type TimelineMarker } from '@/features/player/Timeline';
import { RatePicker, TimeReadout, TransportBar } from '@/features/player/TransportBar';
import { useMainPlayer } from '@/features/player/useMainPlayer';
import { spacing } from '@/theme';

export function Editor({ session, media }: { session: Session; media: MediaRef }) {
  const main = useMainPlayer(session, media);
  const ready = main.status === 'readyToPlay';

  const markers = useMemo<TimelineMarker[]>(
    () => [
      ...session.annotations.map((a) => ({ id: a.id, timeSec: a.timeSec, kind: a.kind })),
      ...session.clips.map((c) => ({ id: c.id, timeSec: c.timeSec, kind: 'clip' as const })),
    ],
    [session.annotations, session.clips],
  );

  const aspect = media.width && media.height ? media.width / media.height : 16 / 9;

  return (
    <View style={styles.container}>
      <PlayerSurface main={main} style={{ width: '100%', aspectRatio: Math.max(aspect, 4 / 5) }} />
      <ScrollView contentContainerStyle={styles.controls}>
        <Timeline
          duration={main.duration}
          time={main.time}
          markers={markers}
          onScrubStart={main.scrubStart}
          onScrub={main.scrub}
        />
        <View style={styles.row}>
          <TimeReadout time={main.time} duration={main.duration} />
          <RatePicker main={main} disabled={!ready} />
        </View>
        <TransportBar main={main} disabled={!ready} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
