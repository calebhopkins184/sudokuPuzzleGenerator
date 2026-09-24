import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { mediaExists, mediaUri } from '@/features/media/mediaFiles';
import type { Session } from '@/features/sessions/types';
import { colors, radius, spacing } from '@/theme';

import type { MainPlayer } from './useMainPlayer';

/**
 * Plays inserted clips over the main video. A second player keeps the main
 * video's buffer and position intact, so returning to T is instant.
 */
export function ClipOverlay({ main, session }: { main: MainPlayer; session: Session }) {
  const clipPlayer = useVideoPlayer(null, (p) => {
    p.loop = false;
  });
  const [activeId, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const setActiveId = (id: string | null) => {
    activeRef.current = id;
    setActive(id);
  };
  const live = useRef({ session, main });
  live.current = { session, main };

  useEffect(() => {
    const controller = main.clipController;
    controller.current = {
      play: (clipId) => {
        const { session: s, main: m } = live.current;
        const clip = s.clips.find((c) => c.id === clipId);
        const media = clip ? s.media[clip.mediaId] : undefined;
        if (!clip || !media || !mediaExists(media.fileName)) {
          setActiveId(null);
          m.clipFailed();
          return;
        }
        setActiveId(clipId);
        clipPlayer
          .replaceAsync({ uri: mediaUri(media.fileName) })
          .then(() => {
            clipPlayer.currentTime = 0;
            clipPlayer.play();
          })
          .catch(() => {
            setActiveId(null);
            live.current.main.clipFailed();
          });
      },
      stop: () => {
        clipPlayer.pause();
        setActiveId(null);
      },
    };
    return () => {
      controller.current = null;
    };
    // setActiveId only touches a ref and state setter, both stable.
  }, [main.clipController, clipPlayer]);

  useEventListener(clipPlayer, 'playToEnd', () => live.current.main.clipFinished());
  useEventListener(clipPlayer, 'statusChange', ({ status }) => {
    if (status === 'error' && activeRef.current) live.current.main.clipFailed();
  });

  if (!activeId) return null;
  const clip = session.clips.find((c) => c.id === activeId);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <VideoView
        player={clipPlayer}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
      <View style={styles.bar}>
        <Text style={styles.label} numberOfLines={1}>
          Clip · {clip?.label ?? ''}
        </Text>
        <Button
          label="Skip"
          icon="play-skip-forward"
          variant="secondary"
          onPress={() => main.clipFinished()}
          accessibilityHint="Stops the clip and returns to the match"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: '#000' },
  bar: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    color: colors.text,
    backgroundColor: colors.clip,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    overflow: 'hidden',
    fontWeight: '700',
  },
});
