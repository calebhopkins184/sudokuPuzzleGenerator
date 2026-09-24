import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Caption, IconButton, type IconName } from '@/components/ui';
import { useSessions } from '@/features/sessions/SessionsStore';
import type { Annotation, ClipInsert, Session } from '@/features/sessions/types';
import { formatTime } from '@/lib/time';
import { colors, radius, spacing, type } from '@/theme';

type Mark =
  | { kind: 'note' | 'link'; id: string; timeSec: number; annotation: Annotation }
  | { kind: 'clip'; id: string; timeSec: number; clip: ClipInsert };

const META: Record<Mark['kind'], { icon: IconName; color: string; label: string }> = {
  note: { icon: 'chatbox-ellipses', color: colors.note, label: 'Note' },
  link: { icon: 'link', color: colors.link, label: 'Link' },
  clip: { icon: 'film', color: colors.clip, label: 'Clip' },
};

type Props = {
  session: Session;
  currentTime: number;
  onJump: (timeSec: number) => void;
  onPlayClip?: (clip: ClipInsert) => void;
};

export function MarksList({ session, currentTime, onJump, onPlayClip }: Props) {
  const { dispatch } = useSessions();

  const marks = useMemo<Mark[]>(
    () =>
      [
        ...session.annotations.map((a) => ({
          kind: a.kind,
          id: a.id,
          timeSec: a.timeSec,
          annotation: a,
        })),
        ...session.clips.map((c) => ({
          kind: 'clip' as const,
          id: c.id,
          timeSec: c.timeSec,
          clip: c,
        })),
      ].sort((a, b) => a.timeSec - b.timeSec),
    [session.annotations, session.clips],
  );

  if (marks.length === 0) {
    return (
      <View style={styles.empty}>
        <Caption style={{ textAlign: 'center' }}>
          No marks yet. Pause on a key moment and add a note, link or clip.
        </Caption>
      </View>
    );
  }

  const confirmDelete = (mark: Mark) =>
    Alert.alert(`Delete ${META[mark.kind].label.toLowerCase()}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          mark.kind === 'clip'
            ? dispatch({ type: 'deleteClip', sessionId: session.id, clipId: mark.id })
            : dispatch({ type: 'deleteAnnotation', sessionId: session.id, annotationId: mark.id }),
      },
    ]);

  const openLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Couldn’t open link', 'Check your connection and try again.');
    }
  };

  return (
    <View style={styles.list}>
      {marks.map((mark) => {
        const meta = META[mark.kind];
        const active = Math.abs(currentTime - mark.timeSec) < 0.5;
        const text =
          mark.kind === 'clip'
            ? mark.clip.label
            : mark.annotation.kind === 'note'
              ? mark.annotation.text
              : mark.annotation.title;
        const sub =
          mark.kind === 'link' && mark.annotation.kind === 'link'
            ? mark.annotation.url
            : mark.kind === 'clip'
              ? 'Inserted clip'
              : null;

        return (
          <View key={mark.id} style={[styles.row, active && styles.rowActive]}>
            <Pressable
              style={styles.main}
              onPress={() => onJump(mark.timeSec)}
              accessibilityRole="button"
              accessibilityLabel={`${meta.label} at ${formatTime(mark.timeSec)}: ${text}`}
              accessibilityHint="Jumps the video to this moment"
            >
              <Ionicons name={meta.icon} size={18} color={meta.color} />
              <Text style={styles.time}>{formatTime(mark.timeSec, true)}</Text>
              <View style={{ flex: 1 }}>
                <Body numberOfLines={3}>{text}</Body>
                {sub ? <Caption numberOfLines={1}>{sub}</Caption> : null}
              </View>
            </Pressable>
            {mark.kind === 'link' && mark.annotation.kind === 'link' ? (
              <IconButton
                icon="open-outline"
                label={`Open ${mark.annotation.title}`}
                onPress={() => void openLink((mark.annotation as { url: string }).url)}
                color={colors.link}
              />
            ) : null}
            {mark.kind === 'clip' && onPlayClip ? (
              <IconButton
                icon="play-circle-outline"
                label={`Play clip ${mark.clip.label}`}
                onPress={() => onPlayClip(mark.clip)}
                color={colors.clip}
              />
            ) : null}
            <IconButton
              icon="trash-outline"
              label={`Delete ${meta.label.toLowerCase()}`}
              onPress={() => confirmDelete(mark)}
              color={colors.textMuted}
              size={20}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  empty: { padding: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
  },
  rowActive: { backgroundColor: colors.surfaceRaised },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  time: { ...type.mono, color: colors.textMuted, minWidth: 56 },
});
