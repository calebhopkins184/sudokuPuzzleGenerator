import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { MarksList } from '@/features/editor/MarksList';
import type { MediaRef, Session } from '@/features/sessions/types';
import { ClipOverlay } from '@/features/player/ClipOverlay';
import { InsertBadge } from '@/features/player/InsertBadge';
import { PlayerSurface } from '@/features/player/PlayerSurface';
import { useSessions } from '@/features/sessions/SessionsStore';
import { Timeline, type TimelineMarker } from '@/features/player/Timeline';
import { RatePicker, TimeReadout, TransportBar } from '@/features/player/TransportBar';
import { useMainPlayer } from '@/features/player/useMainPlayer';
import { spacing } from '@/theme';

export function Editor({ session, media }: { session: Session; media: MediaRef }) {
  const { state } = useSessions();
  const main = useMainPlayer(session, media);
  const ready = main.status === 'readyToPlay';

  const markers = useMemo<TimelineMarker[]>(
    () => [
      ...session.annotations.map((a) => ({ id: a.id, timeSec: a.timeSec, kind: a.kind })),
      ...session.clips.map((c) => ({ id: c.id, timeSec: c.timeSec, kind: 'clip' as const })),
    ],
    [session.annotations, session.clips],
  );

  const addMark = (kind: 'note' | 'link' | 'clip') => {
    main.player.pause();
    const pathname = {
      note: '/session/[id]/note',
      link: '/session/[id]/link',
      clip: '/session/[id]/clip',
    } as const;
    router.push({ pathname: pathname[kind], params: { id: session.id, t: String(main.time) } });
  };

  const aspect = media.width && media.height ? media.width / media.height : 16 / 9;

  return (
    <View style={styles.container}>
      <PlayerSurface main={main} style={{ width: '100%', aspectRatio: Math.max(aspect, 4 / 5) }}>
        <InsertBadge mode={main.mode} onReturn={main.seekTo} />
        <ClipOverlay main={main} session={session} />
      </PlayerSurface>
      <ScrollView contentContainerStyle={styles.controls}>
        <Timeline
          duration={main.duration}
          time={main.time}
          markers={markers}
          highlight={main.mode.kind === 'insert' ? main.mode : null}
          onScrubStart={main.scrubStart}
          onScrub={main.scrub}
        />
        <View style={styles.row}>
          <TimeReadout time={main.time} duration={main.duration} />
          <RatePicker main={main} disabled={!ready} />
        </View>
        <TransportBar main={main} disabled={!ready} />
        <View style={styles.actions}>
          <Button
            label={`Replay ${state.settings.replayWindowSec}s`}
            icon="refresh"
            variant="secondary"
            onPress={() => main.insert('replay')}
            disabled={!ready}
            style={styles.action}
            accessibilityHint="Replays the last few seconds, then returns to this moment"
          />
          <Button
            label={`Slow-mo ${state.settings.slowRate}×`}
            icon="timer-outline"
            variant="secondary"
            onPress={() => main.insert('slow')}
            disabled={!ready}
            style={styles.action}
            accessibilityHint="Replays the last few seconds in slow motion, then returns"
          />
          <Button
            label="Note"
            icon="chatbox-ellipses-outline"
            variant="secondary"
            onPress={() => addMark('note')}
            style={styles.action}
          />
          <Button
            label="Link"
            icon="link-outline"
            variant="secondary"
            onPress={() => addMark('link')}
            style={styles.action}
          />
          <Button
            label="Clip"
            icon="film-outline"
            variant="secondary"
            onPress={() => addMark('clip')}
            style={styles.action}
          />
        </View>
        <MarksList
          session={session}
          currentTime={main.time}
          onJump={main.seekTo}
          onPlayClip={main.playClip}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  action: { flexGrow: 1, flexBasis: 100 },
  controls: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
